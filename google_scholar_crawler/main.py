import json
import os
import time
from datetime import datetime
from pathlib import Path

from scholarly import ProxyGenerator, scholarly

RESULTS_DIRECTORY = Path("results")


def configure_proxy() -> None:
    proxy_generator = ProxyGenerator()
    proxy_generator.FreeProxies()
    scholarly.use_proxy(proxy_generator)


def fetch_author() -> dict:
    author = scholarly.search_author_id(os.environ["GOOGLE_SCHOLAR_ID"])
    scholarly.fill(
        author,
        sections=["basics", "indices", "counts", "publications"],
    )
    author["updated"] = datetime.now().isoformat()
    author["publications"] = {
        publication["author_pub_id"]: publication
        for publication in author["publications"]
    }
    return author


def write_json(filename: str, data: dict) -> None:
    RESULTS_DIRECTORY.mkdir(exist_ok=True)
    output_path = RESULTS_DIRECTORY / filename

    with output_path.open("w", encoding="utf-8") as output_file:
        json.dump(data, output_file, ensure_ascii=False)


def main() -> None:
    configure_proxy()
    time.sleep(5)

    author = fetch_author()
    print(json.dumps(author, indent=2))
    write_json("gs_data.json", author)
    write_json(
        "gs_data_shieldsio.json",
        {
            "schemaVersion": 1,
            "label": "citations",
            "message": str(author["citedby"]),
        },
    )


if __name__ == "__main__":
    main()
