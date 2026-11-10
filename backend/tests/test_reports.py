def test_export_pdf_report(client):
    res = client.get("/api/v1/reports/pdf?report_type=daily")
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert len(res.content) > 1000  # Generated PDF has valid binary content
    assert res.content[:4] == b"%PDF"

def test_export_csv_messages(client):
    res = client.get("/api/v1/reports/csv?data_type=messages")
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    lines = res.text.splitlines()
    assert len(lines) > 1
    assert "ID,Timestamp,Sender,Risk Score,Status,Content Snippet" in lines[0]
