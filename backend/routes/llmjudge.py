""" API endpoints for hallucination metrics
"""
from dotenv import load_dotenv
load_dotenv()

from fastapi import APIRouter, HTTPException
from deepeval.models import LiteLLMModel
from deepeval.test_case import LLMTestCase
from deepeval.metrics import GEval
from deepeval.test_case import LLMTestCaseParams
from schemas import LLMJudgeRequest, LLMJudgeResponse
import os

router = APIRouter(prefix="/v1", tags=["llmjudge"])  
judge_model = None

def get_judge_model():
    global judge_model
    if judge_model:
        return judge_model

    groq_key = os.environ.get("GROQ_API_KEY")
    if not groq_key:
        raise HTTPException(
            status_code=503,
            detail="GROQ_API_KEY is not set. Hallucination metrics (LLM-as-a-judge) failed."
        )
    judge_model = LiteLLMModel(
        model="groq/llama-3.3-70b-versatile",
        api_key=groq_key
    )
    return judge_model

@router.post("/judge", response_model=LLMJudgeResponse)
async def judge_output(request: LLMJudgeRequest):
    try:
        metric = GEval(
            name="Hallucination",
            criteria="Given an input text and a predicted next word, determine if the predicted word could plausibly continue the input as part of a longer phrase. Common words like 'the', 'a', 'of', 'in' are almost always valid continuations and should score 1.0 without further comment. For content words (nouns, verbs, adjectives), evaluate factual correctness and plausibility. Only score low if the word is clearly factually wrong or grammatically impossible. Keep reasoning concise and focused on whether the word fits, not on what it is.",
            evaluation_params=[LLMTestCaseParams.INPUT, LLMTestCaseParams.ACTUAL_OUTPUT],
            model=get_judge_model(), async_mode=False
        )
        test_case = LLMTestCase(
            input=request.input_text,
            actual_output=request.generated_text
        )
        metric.measure(test_case)

        # GEval returns a correctness score (1.0 = fully correct, 0.0 = fully incorrect).
        # Convert this to a hallucination score so that higher = more hallucination.
        hallucination_score = 1.0 - metric.score

        if hallucination_score < 0.3:
            conclusion = "low"
        elif hallucination_score < 0.7:
            conclusion = "medium"
        else:
            conclusion = "high"
        
        # "passed" is still based on correctness versus the metric's threshold.
        passed = metric.score >= metric.threshold

        return LLMJudgeResponse(
            score=hallucination_score,
            conclusion=conclusion,
            reason=metric.reason,
            passed=passed
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Hallucination metrics (LLM-as-a-judge) failed: {str(e)}"
        )
