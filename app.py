import sys
import manganelo


# Function to download chapters for a given manga name
def download_chapters(manga_name):
    results = manganelo.get_search_results(manga_name)

    for r in results:
        print(r.title, r.views)

        chapters = r.chapter_list

        icon_path = r.download_icon("./icon.png")

        for c in chapters:
            print(f"#{c.chapter} | {c.title}")

            chapter_path = c.download(f"./{manga_name} - Chapter {c.chapter}.pdf")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python app.py <manga_name>")
        sys.exit(1)

    manga_name = sys.argv[1]
    download_chapters(manga_name)
