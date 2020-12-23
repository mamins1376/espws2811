from os import path
from glob import glob
from gzip import compress

Import("env")

html_h_template = """\
#include <sys/pgmspace.h>
#ifndef {ident}_gzip_len
#define {ident}_gzip_len {length}
extern const uint8_t index_html_gzip[] PROGMEM;
#endif
"""

html_c_template = """\
#include "{name}.h"
const uint8_t {ident}_gzip[] PROGMEM = {{
  {table}
}};
"""

def get_minify(retry=True):
    try:
        import htmlmin
        def minify(data):
            return htmlmin.minify(
                data.decode("utf-8"),
                remove_comments=True,
                remove_all_empty_space=True
            ).encode("utf-8")
        return minify
    except ImportError:
        if not retry:
            raise
        env.Execute("$PYTHONEXE -m pip install htmlmin")
        return get_minify(False)

def hex_lines(data):
    w = 13
    i, j, l = 0, w, len(data)
    while i < l:
        yield ", ".join(f"0x{b:02X}" for b in data[i:min(j, l)])
        i, j = j, j + w

def is_fine(file, mtime):
    if not path.exists(file):
        return False
    return path.getmtime(file) > mtime

def html_to_c(name):
    html = f"web/{name}"
    head = f"include/{name}.h"
    code = f"src/{name}.c"

    mtime = path.getmtime(html)
    if is_fine(head, mtime) and is_fine(code, mtime):
        return

    print("Generating c code for web asset:", name)

    with open(html, "rb") as f:
        data = f.read()

    data = compress(get_minify()(data))

    vars = {
        "name": name,
        "ident": name.replace(".", "_"),
        "table": ",\n  ".join(hex_lines(data)),
        "length": len(data)
    }

    with open(head, "w") as f:
        f.write(html_h_template.format(**vars))

    with open(code, "w") as f:
        f.write(html_c_template.format(**vars))

for relpath in glob("web/*.html"):
    html_to_c(path.basename(relpath))
