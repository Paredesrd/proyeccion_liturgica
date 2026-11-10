from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
import re
from database.connection import get_bible_db
from core.logger import log

router = APIRouter()

@router.get("/api/bible/search-text")
def search_text_bible(q: str, version: str = None, limit: int = 30, db: Session = Depends(get_bible_db)):
    if not q or len(q.strip()) < 2:
        raise HTTPException(status_code=400, detail="La búsqueda debe tener al menos 2 caracteres")
    
    q = q.strip()
    
    # Búsqueda exacta (entre comillas) o por palabras clave (AND)
    if q.startswith('"') and q.endswith('"') and len(q) > 2:
        query_fts = q
    else:
        palabras = re.findall(r'\w+', q, re.UNICODE)
        if not palabras:
            raise HTTPException(status_code=400, detail="La búsqueda no contiene palabras válidas")
        query_fts = " AND ".join(f'"{p}"' for p in palabras)
    
    try:
        if version:
            sql = text("""
                SELECT version, libro, nombre_libro_original, capitulo, versiculo, texto,
                       highlight(versiculos_fts, 5, '<<HL>>', '<</HL>>') as texto_resaltado,
                       bm25(versiculos_fts) as score
                FROM versiculos_fts
                WHERE versiculos_fts MATCH :query AND version = :version
                ORDER BY score ASC LIMIT :limit
            """)
            params = {"query": query_fts, "version": version, "limit": limit}
        else:
            sql = text("""
                SELECT version, libro, nombre_libro_original, capitulo, versiculo, texto,
                       highlight(versiculos_fts, 5, '<<HL>>', '<</HL>>') as texto_resaltado,
                       bm25(versiculos_fts) as score
                FROM versiculos_fts
                WHERE versiculos_fts MATCH :query
                ORDER BY score ASC LIMIT :limit
            """)
            params = {"query": query_fts, "limit": limit}
        
        rows = db.execute(sql, params).fetchall()
        resultados = []
        for r in rows:
            resultados.append({
                "version": r[0], "libro_db": r[1], "nombre_libro_original": r[2],
                "capitulo": r[3], "versiculo": r[4],
                "referencia": f"{r[2]} {r[3]}:{r[4]}", "texto": r[5],
                "snippet": r[6].replace("<<HL>>", "<mark>").replace("<</HL>>", "</mark>"),
                "score": r[7]
            })
        return {"total": len(resultados), "query": query_fts, "resultados": resultados}
    except Exception as e:
        log.error(f"Error en búsqueda textual: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno en la búsqueda")