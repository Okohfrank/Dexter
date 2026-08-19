import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_health_and_api_routes():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "healthy"

        # Verify all routes are correctly compiled in the OpenAPI specification
        res_docs = await client.get("/openapi.json")
        assert res_docs.status_code == 200
        paths = res_docs.json()["paths"]
        assert "/api/v1/strategy/{business_id}/generate" in paths
        assert "/api/v1/analytics/history" in paths
        assert "/api/v1/analytics/learnings" in paths
        assert "/api/v1/voice/transcribe" in paths
