import spacy

nlp = spacy.load("en_core_web_sm")

def extract_tags_from_text(text: str) -> list[str]:
    doc = nlp(text)
    tags = set()

    for token in doc:
        if token.pos_ in {"NOUN", "PROPN"} and len(token.text) > 2:
            tags.add(token.lemma_.lower())

    return list(tags)
