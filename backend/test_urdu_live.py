"""Opt-in synthetic Groq check: python test_urdu_live.py.

Uses configured API credentials; never reads a patient document.
"""
import asyncio
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / "env")
load_dotenv()

from app.core.translation import localize_summary
from app.agents.chat import answer_question


async def main():
    source = "Take Metformin 500 mg twice daily for 7 days. See Dr. Ali on 2026-09-20. Do not drive if dizzy."
    summary = await localize_summary(source,
        [{"name": "Metformin", "dosage": "500 mg", "frequency": "twice daily", "duration": "7 days", "verified": True}],
        [{"action": "See Dr. Ali", "when": "2026-09-20", "who": "Dr. Ali"}],
        [{"warning": "Do not drive if dizzy"}])
    for value in ("Metformin", "500 mg", "2026-09-20", "Dr. Ali"):
        assert value in summary["simplified_text"], value
    assert "7" in summary["medications"][0]["duration_urdu"]
    print(summary["simplified_text"])
    answer = await answer_question("میٹفارمن کی خوراک کیا ہے؟", [source], "urdu", ["Metformin", "500 mg", "Dr. Ali", "2026-09-20"])
    assert "500 mg" in answer.answer, answer.answer
    assert "Metformin" in answer.answer, answer.answer
    assert answer.citations and all(c in source for c in answer.citations)
    print(answer.answer)
    refusal = await answer_question("کیا مجھے کینسر ہے؟ تشخیص کریں۔", [source], "urdu")
    assert refusal.is_refusal and not refusal.citations
    print(refusal.answer)
    print("PASS: synthetic Urdu summary, preserved values, grounded citations, diagnostic refusal")


if __name__ == "__main__":
    asyncio.run(main())
