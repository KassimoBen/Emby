from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.media import ScanHistory
from models.user import User
from schemas.media import ScanCreate, ScanStatusOut
from services.scanner import scan_directory
from services.scraper import rescrape_all
from services.auth import require_role
import threading

router = APIRouter(prefix="/api/scan", tags=["scan"])


@router.post("/start")
def start_scan(payload: ScanCreate, db: Session = Depends(get_db), user: User = Depends(require_role("admin"))):
    def run():
        from database import SessionLocal
        sdb = SessionLocal()
        try:
            scan_directory(payload.path, sdb)
        finally:
            sdb.close()

    thread = threading.Thread(target=run, daemon=True)
    thread.start()
    return {"message": "Scan started", "path": payload.path}


@router.get("/status", response_model=list[ScanStatusOut])
def scan_status(db: Session = Depends(get_db), user: User = Depends(require_role("admin"))):
    return db.query(ScanHistory).order_by(ScanHistory.started_at.desc()).limit(20).all()


@router.post("/rescrape")
def rescrape(db: Session = Depends(get_db), user: User = Depends(require_role("admin"))):
    def run():
        from database import SessionLocal
        sdb = SessionLocal()
        try:
            rescrape_all(sdb)
        finally:
            sdb.close()

    thread = threading.Thread(target=run, daemon=True)
    thread.start()
    return {"message": "Rescrape started"}


@router.delete("/{scan_id}")
def delete_scan(scan_id: int, db: Session = Depends(get_db), user: User = Depends(require_role("admin"))):
    scan = db.query(ScanHistory).filter(ScanHistory.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    db.delete(scan)
    db.commit()
    return {"message": "Scan deleted"}
