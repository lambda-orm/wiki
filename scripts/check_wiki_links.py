"""Checks the absolute links to the wiki (https://lambda-orm.github.io/wiki/...) of some Markdown files against a
built site: each one must be a page (or a file) of the site and, with an anchor, the page must have that id.

    python scripts/check_wiki_links.py <site dir> <file.md> [<file.md> ...]

Exits with 1 and lists the broken links when there are any. No dependencies.
"""
import os
import re
import sys

LINK = re.compile(r'https://lambda-orm\.github\.io/wiki(/[^\s)"\'<>`\]]*)?')


def target(site: str, path: str) -> str | None:
    path = path.strip('/')
    for candidate in (os.path.join(site, path, 'index.html'), os.path.join(site, path)):
        if os.path.isfile(candidate):
            return candidate
    return None


def main() -> int:
    site, files = sys.argv[1], sys.argv[2:]
    broken = []
    for file in files:
        with open(file, encoding='utf8') as f:
            for number, line in enumerate(f, 1):
                for match in LINK.finditer(line):
                    path, _, anchor = (match.group(1) or '/').partition('#')
                    page = target(site, path)
                    if page is None:
                        broken.append(f'{file}:{number}: {match.group(0)} (no such page)')
                    elif anchor and f'id="{anchor}"' not in open(page, encoding='utf8').read():
                        broken.append(f'{file}:{number}: {match.group(0)} (no #{anchor} on the page)')
    for line in broken:
        print(line)
    print(f'{len(broken)} broken link(s) to the wiki' if broken else 'every link to the wiki resolves')
    return 1 if broken else 0


if __name__ == '__main__':
    sys.exit(main())
