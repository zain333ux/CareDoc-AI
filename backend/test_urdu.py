"""Offline regression tests: python -m unittest test_urdu -v."""
import os
import unittest
from unittest.mock import AsyncMock, patch

os.environ["PYTHON_DOTENV_DISABLED"] = "1"
os.environ["GROQ_API_KEY"] = "test-only"

from app.core.translation import protect_text, restore_text, localize_summary, source_summary, translate_texts, TranslatedTexts
from types import SimpleNamespace
from fastapi.testclient import TestClient


class TranslationTests(unittest.IsolatedAsyncioTestCase):
    def test_precaution_without_severity_keeps_warning(self):
        from app.models.schemas import ComprehensiveExtraction
        result = ComprehensiveExtraction.model_validate({"precautions": [{"warning": "Do not drive if dizzy"}]})
        self.assertEqual(result.precautions[0].warning, "Do not drive if dizzy")
        self.assertIsNone(result.precautions[0].severity_hint)

    async def test_large_translation_uses_small_batches_and_keeps_order(self):
        import json
        from langchain_core.runnables import RunnableLambda

        def provider(prompt):
            inputs = json.loads(prompt.messages[-1].content)
            if len(inputs) > 4:
                raise ValueError("Provider cannot generate this large structured response")
            return TranslatedTexts(texts=[value.replace("days", "دن") for value in inputs])

        with patch("app.agents.simplifier.llm") as llm:
            llm.with_structured_output.return_value = RunnableLambda(provider)
            result = await translate_texts([f"{i} days" for i in range(12)])
        self.assertEqual(result, [f"{i} دن" for i in range(12)])

    def test_summary_composes_only_extracted_values(self):
        text = source_summary([{"name": "Metformin", "dosage": "500 mg", "frequency": "twice daily"}], [{"action": "Review", "when": "2026-09-20", "who": "Dr. Ali"}], [])
        self.assertIn("500 mg", text)
        self.assertIn("2026-09-20", text)
        self.assertNotIn("morning", text)
        self.assertNotIn("tablet", text)
    def test_protects_medication_dose_dates_and_numbers(self):
        source = "Metformin 500 mg on September 15, 2026, every 8 hours."
        masked, values = protect_text(source, ["Metformin", "500 mg", "September 15, 2026"])
        self.assertNotIn("Metformin", masked)
        self.assertNotIn("500", masked)
        self.assertEqual(restore_text(masked, values), source)

    def test_rejects_lost_duplicate_and_invented_values(self):
        masked, values = protect_text("Take 500 mg", ["500 mg"])
        for bad in ["دوا لیں", masked + masked, masked + " 100", masked + " __KEEP_99__"]:
            with self.assertRaises(ValueError):
                restore_text(bad, values)

    def test_doses_are_protected_without_model_identifying_them(self):
        masked, values = protect_text("Take 500 mg and 2.5 mL", [])
        self.assertNotIn("mg", masked)
        self.assertNotIn("mL", masked)
        self.assertEqual(restore_text(masked, values), "Take 500 mg and 2.5 mL")

    async def test_preserves_original_structured_fields(self):
        meds = [{"name": "Metformin", "dosage": "500 mg", "frequency": "twice daily", "duration": "7 days", "verified": False}]
        follow = [{"action": "Review", "when": "2026-09-20", "who": "Dr. Ali"}]
        precautions = [{"warning": "Do not drive", "severity_hint": "Caution"}]
        with patch("app.core.translation.translate_texts", new=AsyncMock(return_value=["دن میں دو بار", "7 دن", "معائنہ", "گاڑی نہ چلائیں"])):
            result = await localize_summary("Summary", meds, follow, precautions)
        self.assertEqual(meds[0]["dosage"], "500 mg")
        self.assertNotIn("frequency_urdu", meds[0])
        self.assertEqual(result["medications"][0]["frequency_urdu"], "دن میں دو بار")
        self.assertFalse(result["medications"][0]["verified"])
        self.assertEqual(result["follow_up"][0]["when"], "2026-09-20")
        self.assertIn("دن میں دو بار", result["simplified_text"])
        self.assertIn("2026-09-20", result["simplified_text"])


class LanguageApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with patch("pinecone.Pinecone") as pc:
            pc.return_value.list_indexes.return_value.names.return_value = ["caredoc-index"]
            from main import app
        cls.client = TestClient(app)

    def test_invalid_chat_language_rejected(self):
        response = self.client.post("/documents/test/chat", json={"query": "hello", "language": "spanish"})
        self.assertEqual(response.status_code, 422)

    def test_empty_context_urdu_refusal(self):
        with patch("app.api.documents.query_document", return_value=[]), patch("app.api.documents.supabase", None):
            response = self.client.post("/documents/test/chat", json={"query": "میری دوا؟", "language": "urdu"})
        self.assertEqual(response.status_code, 200)
        self.assertIn("ڈاکٹر", response.json()["answer"])
        self.assertTrue(response.json()["is_refusal"])
        self.assertEqual(response.json()["citations"], [])

    def test_chat_language_defaults_and_propagates(self):
        from app.agents.chat import CitedAnswer
        for payload, language in [({"query": "hello"}, "english"), ({"query": "hello", "language": "urdu"}, "urdu")]:
            answer = AsyncMock(return_value=CitedAnswer(answer="جواب", citations=[]))
            with patch("app.api.documents.query_document", return_value=["source"]), patch("app.api.documents.supabase", None), patch("app.api.documents.answer_question", answer):
                response = self.client.post("/documents/test/chat", json=payload)
            self.assertEqual(response.status_code, 200)
            answer.assert_awaited_once_with("hello", ["source"], language=language, protected_terms=[])

    def test_upload_language_and_failure(self):
        for language, fail in [("english", False), ("urdu", False), ("urdu", True)]:
            extraction = SimpleNamespace(dict=lambda: {"medications": [], "follow_up": [], "precautions": []})
            verifier = SimpleNamespace(dict=lambda: {"flags": []})
            translated = {"simplified_text": "خلاصہ", "medications": [], "follow_up": [], "precautions": []}
            localize = AsyncMock(side_effect=ValueError("bad translation") if fail else None, return_value=translated)
            with patch("app.api.documents.extract_text_from_pdf", return_value="source"), patch("app.agents.chat.llm", SimpleNamespace(invoke=lambda p: SimpleNamespace(content="YES"))), patch("app.api.documents.process_and_store_document", return_value=["source"]), patch("app.api.documents.extract_all", AsyncMock(return_value=extraction)), patch("app.api.documents.verify_medications", AsyncMock(return_value=[])), patch("app.api.documents.simplify_summary", AsyncMock(return_value="Summary")), patch("app.api.documents.verify_summary", AsyncMock(return_value=verifier)), patch("app.api.documents.localize_summary", localize), patch("app.api.documents.supabase", None):
                response = self.client.post("/documents/upload", files={"file": ("sample.pdf", b"test", "application/pdf")}, data={"user_id": "test", "language": language})
            self.assertEqual(response.status_code, 502 if fail else 200)
            if not fail:
                self.assertEqual(response.json()["summary"]["language"], language)
            self.assertEqual(localize.await_count, int(language == "urdu"))


if __name__ == "__main__":
    unittest.main()
