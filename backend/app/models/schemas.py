from pydantic import BaseModel, Field
from typing import List, Optional

class Medication(BaseModel):
    name: str = Field(description="Name of the medication")
    dosage: str = Field(description="Dosage of the medication (e.g., 50mg, 1 tablet)")
    frequency: str = Field(description="How often to take the medication (e.g., twice a day, every 8 hours)")
    duration: Optional[str] = Field(description="How long to take the medication, if specified")
    verified: Optional[bool] = Field(default=None, description="True if verified against source document, False if not")
    verification_note: Optional[str] = Field(default=None, description="Reason if verification failed")

class MedicationExtraction(BaseModel):
    medications: List[Medication] = Field(default_factory=list, description="List of extracted medications")

class FollowUp(BaseModel):
    action: str = Field(description="The action to take (e.g., Schedule an appointment, get a blood test)")
    when: str = Field(description="When the action should happen (e.g., in 2 weeks, next Monday)")
    who: str = Field(description="Who to see or contact (e.g., Dr. Smith, Primary Care Provider)")

class FollowUpExtraction(BaseModel):
    follow_up: List[FollowUp] = Field(default_factory=list, description="List of follow-up instructions")

class Precaution(BaseModel):
    warning: str = Field(description="The precaution, restriction, or warning sign to look out for")
    severity_hint: str = Field(description="Implied severity (e.g., Emergency, Routine, Caution)")

class PrecautionExtraction(BaseModel):
    precautions: List[Precaution] = Field(default_factory=list, description="List of precautions and warnings")

class VerificationFlag(BaseModel):
    claim: str = Field(description="The specific claim made in the summary")
    issue: str = Field(description="Why this claim is flagged (e.g., 'not found in source document', 'contradicts source')")

class VerificationResult(BaseModel):
    verified: bool = Field(description="True if all claims are fully supported by the source document, False if any claims are flagged")
    flags: List[VerificationFlag] = Field(default_factory=list, description="List of flagged claims that could not be verified")

class ComprehensiveExtraction(BaseModel):
    medications: List[Medication] = Field(default_factory=list, description="List of extracted medications")
    follow_up: List[FollowUp] = Field(default_factory=list, description="List of follow-up instructions")
    precautions: List[Precaution] = Field(default_factory=list, description="List of precautions and warnings")
