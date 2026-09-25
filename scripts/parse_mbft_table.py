import json
import re
import unicodedata
from pathlib import Path

import pdfplumber

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / ".site" / "mbft-extracted"
OUTPUT = ROOT / "src" / "lib" / "ctb-data.json"
REPLACEMENTS = {
    "Tipifica��o": "Tipificação", "C�digo": "Código", "Tr�nsito": "Trânsito", "Fiscaliza��o": "Fiscalização",
    "Grav�ssima": "Gravíssima", "N�o": "Não", "Pontua��o": "Pontuação", "Infra��o": "Infração",
    "ve�culo": "veículo", "habilita��o": "habilitação", "�rg�o": "Órgão", "�rg�os": "Órgãos",
    "informa��es": "informações", "apresenta��o": "apresentação", "reten��o": "retenção", "condu��o": "condução",
    "poss�vel": "possível", "observa��es": "observações", "condi��es": "condições", "administra��o": "administração",
    "defini��es": "definições", "exig�vel": "exigível", "espec�fico": "específico", "espec�fica": "específica",
    "resid�ncia": "residência", "compet�ncia": "competência", "aplica��o": "aplicação", "regulariza��o": "regularização",
    "circula��o": "circulação", "suspens�o": "suspensão",
}

def fix_text(value):
    value = re.sub(r"\s+", " ", (value or "").replace("\u00a0", " ")).strip(" -:\n")
    for source, target in REPLACEMENTS.items():
        value = value.replace(source, target)
    return value.strip()

def key(value):
    value = (value or "").replace("�", "")
    return "".join(char for char in unicodedata.normalize("NFD", value).lower() if unicodedata.category(char) != "Mn")

def cell_value(cell, label):
    lines = [fix_text(line) for line in (cell or "").splitlines() if fix_text(line)]
    label_key = key(label)
    if not lines:
        return ""
    for index in range(min(3, len(lines))):
        header = key(" ".join(lines[:index + 1]))
        if header.startswith(label_key):
            return fix_text(" ".join(lines[index + 1:]))
    return ""

def parse_pdf(filename):
    tables = []
    with pdfplumber.open(filename) as pdf:
        for page in pdf.pages:
            tables.extend(page.extract_tables() or [])
    cells = [cell for table in tables for row in table for cell in row if cell]
    def find(label):
        return next((value for cell in cells if (value := cell_value(cell, label))), "")
    code_match = re.search(r"\d{3}-\d{2}", find("Código do Enquadramento"))
    if not code_match:
        return None
    sections = {"whenToAutuate": [], "whenNotToAutuate": [], "procedures": [], "examples": []}
    for table in tables:
        for row_index, row in enumerate(table):
            headers = [key(cell) for cell in row]
            if not any("quando autuar" in header for header in headers):
                continue
            positions = {}
            for index, header in enumerate(headers):
                if "quando autuar" in header and "nao" not in header: positions["whenToAutuate"] = index
                elif "quando nao autuar" in header: positions["whenNotToAutuate"] = index
                elif "definicoes e procedimentos" in header: positions["procedures"] = index
                elif "exemplos do campo" in header: positions["examples"] = index
            for data_row in table[row_index + 1:]:
                for section, index in positions.items():
                    if index < len(data_row) and data_row[index]: sections[section].append(fix_text(data_row[index]))
    return {
        "id": code_match.group(0), "article": find("Amparo Legal"), "summary": find("Tipificação Resumida"),
        "title": find("Tipificação do Enquadramento"), "severity": find("Gravidade"), "penalty": find("Penalidade"),
        "measure": find("Medida Administrativa"), "crime": find("Pode Configurar Crime de Trânsito"),
        "offender": find("Infrator"), "competence": find("Competência"), "points": find("Pontuação"),
        "detection": find("Constatação da Infração"), "whenToAutuate": " ".join(sections["whenToAutuate"]),
        "whenNotToAutuate": " ".join(sections["whenNotToAutuate"]), "procedures": " ".join(sections["procedures"]),
        "examples": " ".join(sections["examples"]), "additional": find("Informações Complementares"), "sourceFile": filename.name,
    }

records = []
for pdf in sorted(SOURCE.rglob("*.pdf")):
    if "Parte Geral" in pdf.name: continue
    try:
        item = parse_pdf(pdf)
    except Exception as error:
        print(f"Falha: {pdf.name.encode('ascii', 'ignore').decode()}: {error}")
        continue
    if item: records.append(item)
records.sort(key=lambda item: item["id"])
OUTPUT.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Geradas {len(records)} fichas em {OUTPUT}")
