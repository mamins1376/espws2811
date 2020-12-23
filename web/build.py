import os.path
import glob

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
        return htmlmin.minify
    except ImportError:
        if not retry:
            raise
        env.Execute("$PYTHONEXE -m pip install htmlmin")
        return get_minify(False)

def hex_lines(data):
    w = 13
    i, j, l = 0, w, len(data)
    while j < l:
        yield ", ".join(f"0x{b:02X}" for b in data[i:min(j, l)])
        i, j = j, j + w

def html_to_c(path):
    if os.path.exists(path + ".c"):
        if os.path.getmtime(path + ".c") > os.path.getmtime(path):
            return

    name = os.path.basename(path)

    print("Generating c code for web asset:", name)

    with open(path, "rb") as f:
        data = f.read()

    data = get_minify()(data.decode("utf-8"))

    if "gzip" not in locals().keys():
        import gzip
    data = gzip.compress(data.encode("utf-8"))

    vars = {
        "name": name,
        "ident": name.replace(".", "_"),
        "table": ",\n  ".join(hex_lines(data)),
        "length": len(data)
    }

    with open(path + ".h", "w") as f:
        f.write(html_h_template.format(**vars))

    with open(path + ".c", "w") as f:
        f.write(html_c_template.format(**vars))

for path in glob.glob("web/*.html"):
    html_to_c(os.path.abspath(path))
