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
FREE_PROXY_ATTEMPTS = 5


def configure_proxy() -> None:
    scraper_api_key = os.getenv("SCRAPER_API_KEY")

    if scraper_api_key:
        proxy_generator = ProxyGenerator()
        configured = proxy_generator.ScraperAPI(scraper_api_key)

        if not configured:
            raise RuntimeError("Unable to configure ScraperAPI for Google Scholar")

        scholarly.use_proxy(proxy_generator, proxy_generator)
        print("Using ScraperAPI for Google Scholar")
        return

    # scholarly 1.7.11 calls an obsolete FreeProxy.get_proxy_list()
    # signature. Obtain proxies through free-proxy's public API and pass
    # them back to scholarly one at a time instead.
    for attempt in range(1, FREE_PROXY_ATTEMPTS + 1):
        try:
            proxy_url = FreeProxy(
                rand=True,
                timeout=2,
                https=True,
                request_timeout=10,
            ).get()
            proxy_generator = ProxyGenerator()
            configured = proxy_generator.SingleProxy(
                http=proxy_url,
                https=proxy_url,
            )

            if configured:
                # Passing the generator twice prevents scholarly from silently
                # creating its own incompatible FreeProxies generator.
                scholarly.use_proxy(proxy_generator, proxy_generator)
                print(f"Using free proxy selected on attempt {attempt}")
                return

            print(f"Free proxy attempt {attempt} failed validation")
        except Exception as error:
            print(f"Free proxy attempt {attempt} failed: {error}")

    # Author-profile requests can sometimes succeed directly. Use an empty
    # generator twice so scholarly does not create its broken free-proxy
    # fallback internally.
    direct_connection = ProxyGenerator()
    scholarly.use_proxy(direct_connection, direct_connection)
    print("Warning: all free proxies failed; trying a direct connection")


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

