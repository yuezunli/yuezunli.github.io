# import json
# import os
# import time
# from datetime import datetime
# from pathlib import Path

# from scholarly import ProxyGenerator, scholarly

# RESULTS_DIRECTORY = Path("results")


# def configure_proxy() -> None:
#     proxy_generator = ProxyGenerator()
#     scraper_api_key = os.getenv("SCRAPER_API_KEY")

#     if scraper_api_key:
#         configured = proxy_generator.ScraperAPI(scraper_api_key)
#         proxy_name = "ScraperAPI"
#     else:
#         configured = proxy_generator.FreeProxies()
#         proxy_name = "free proxy"

#     if not configured:
#         raise RuntimeError(f"Unable to configure {proxy_name} for Google Scholar")

#     scholarly.use_proxy(proxy_generator)


# def fetch_author() -> dict:
#     author = scholarly.search_author_id(os.environ["GOOGLE_SCHOLAR_ID"])
#     scholarly.fill(
#         author,
#         sections=["basics", "indices", "counts", "publications"],
#     )
#     author["updated"] = datetime.now().isoformat()
#     author["publications"] = {
#         publication["author_pub_id"]: publication
#         for publication in author["publications"]
#     }
#     return author


# def write_json(filename: str, data: dict) -> None:
#     RESULTS_DIRECTORY.mkdir(exist_ok=True)
#     output_path = RESULTS_DIRECTORY / filename

#     with output_path.open("w", encoding="utf-8") as output_file:
#         json.dump(data, output_file, ensure_ascii=False)


# def main() -> None:
#     configure_proxy()
#     time.sleep(5)

#     author = fetch_author()
#     print(json.dumps(author, indent=2))
#     write_json("gs_data.json", author)
#     write_json(
#         "gs_data_shieldsio.json",
#         {
#             "schemaVersion": 1,
#             "label": "citations",
#             "message": str(author["citedby"]),
#         },
#     )


# if __name__ == "__main__":
#     main()

import json
import os
import time
from datetime import datetime
from pathlib import Path

from fp.fp import FreeProxy
from scholarly import ProxyGenerator, scholarly

RESULTS_DIRECTORY = Path("results")


def patch_free_proxy() -> None:
    """
    Fix compatibility between scholarly and newer free-proxy versions.

    scholarly calls FreeProxy.get_proxy_list() without arguments, while newer
    free-proxy versions require the repeat argument.
    """
    original_get_proxy_list = FreeProxy.get_proxy_list

    def compatible_get_proxy_list(self, repeat=False):
        return original_get_proxy_list(self, repeat)

    FreeProxy.get_proxy_list = compatible_get_proxy_list


def configure_proxy() -> None:
    patch_free_proxy()

    proxy_generator = ProxyGenerator()
    success = proxy_generator.FreeProxies()

    if not success:
        raise RuntimeError("Failed to configure a free proxy for Google Scholar.")

    scholarly.use_proxy(proxy_generator)


def fetch_author() -> dict:
    scholar_id = os.environ.get("GOOGLE_SCHOLAR_ID")
    if not scholar_id:
        raise RuntimeError("Environment variable GOOGLE_SCHOLAR_ID is not set.")

    author = scholarly.search_author_id(scholar_id)
    scholarly.fill(
        author,
        sections=["basics", "indices", "counts", "publications"],
    )

    author["updated"] = datetime.now().astimezone().isoformat()
    author["publications"] = {
        publication["author_pub_id"]: publication
        for publication in author.get("publications", [])
        if "author_pub_id" in publication
    }

    return author


def write_json(filename: str, data: dict) -> None:
    RESULTS_DIRECTORY.mkdir(parents=True, exist_ok=True)
    output_path = RESULTS_DIRECTORY / filename

    with output_path.open("w", encoding="utf-8") as output_file:
        json.dump(
            data,
            output_file,
            ensure_ascii=False,
            indent=2,
        )


def main() -> None:
    configure_proxy()
    time.sleep(5)

    author = fetch_author()

    print(json.dumps(author, ensure_ascii=False, indent=2))

    write_json("gs_data.json", author)
    write_json(
        "gs_data_shieldsio.json",
        {
            "schemaVersion": 1,
            "label": "citations",
            "message": str(author.get("citedby", 0)),
        },
    )


if __name__ == "__main__":
    main()

