"""Codeforces adapter.

Isolated per SADD 4.3: judge-integration method is flagged as a
likely-to-change TBD (SRS Appendix C, TBD-1). Changes here must not
require touching sync_scheduler.py or topic_tagger.py.
"""
from typing import Optional
from datetime import datetime
import httpx
from app.core.config import settings


class CodeforcesAdapter:
    """Fetch submission data from Codeforces public API (REQ-2.1–2.2)."""

    BASE_URL = settings.CODEFORCES_API_BASE

    @staticmethod
    async def get_submissions(handle: str, since_timestamp: Optional[int] = None) -> dict:
        """
        Fetch accepted submissions for a Codeforces handle (REQ-2.2).

        Returns:
        {
            "status": "OK" or "FAILED",
            "result": [
                {
                    "id": submission_id,
                    "problem": {
                        "contestId": int,
                        "index": str,
                        "name": str,
                        "tags": ["array", "dp", ...]
                    },
                    "creationTimeSeconds": unix_timestamp,
                    "verdict": "OK" or other (we filter to OK only)
                },
                ...
            ]
        }

        Filters to OK (accepted) verdicts only and dedupes by problem.
        """
        try:
            async with httpx.AsyncClient() as client:
                # Codeforces API: user.status returns all submissions for a handle
                response = await client.get(
                    f"{CodeforcesAdapter.BASE_URL}/user.status",
                    params={"handle": handle},
                    timeout=10
                )
                response.raise_for_status()
                data = response.json()

            if data.get("status") != "OK":
                return {"status": "FAILED", "result": [], "error": data.get("comment", "Unknown error")}

            # Filter to accepted submissions
            submissions = data.get("result", [])
            accepted = [s for s in submissions if s.get("verdict") == "OK"]

            # Dedupe by problem: keep only the first (earliest) accepted submission
            seen_problems = {}
            unique_accepted = []
            for sub in accepted:
                problem_key = (sub["problem"]["contestId"], sub["problem"]["index"])
                if problem_key not in seen_problems:
                    seen_problems[problem_key] = True
                    unique_accepted.append(sub)

            return {
                "status": "OK",
                "result": unique_accepted,
                "total_accepted": len(unique_accepted)
            }

        except httpx.HTTPError as e:
            return {"status": "FAILED", "result": [], "error": str(e)}

    @staticmethod
    def extract_problem_tags(submission: dict) -> list[str]:
        """
        Extract problem tags from a submission.

        Returns: List of tag strings (e.g., ["dp", "greedy", "graphs"])
        """
        return submission.get("problem", {}).get("tags", [])

    @staticmethod
    def extract_problem_id(submission: dict) -> str:
        """
        Extract a unique problem ID for deduplication.

        Returns: "{contestId}-{index}" (e.g., "1234-A")
        """
        problem = submission.get("problem", {})
        return f"{problem.get('contestId')}-{problem.get('index')}"

