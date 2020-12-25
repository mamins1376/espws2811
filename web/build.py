from os import path
from glob import iglob
from gzip import compress
from itertools import chain

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

def make_change_checker(*ps):
    def f(n):
        mtime = path.getmtime(n)
        for p in ps:
            if not path.exists(p):
                return False
            return path.getmtime(p) > mtime
    return f

def call_web(*args):
    import subprocess
    try:
        subprocess.check_call(args, cwd="web")
    except subprocess.CalledProcessError as e:
        import sys
        sys.exit(e.returncode)

def bin2hex(data):
    w = 13
    i, j, l = 0, w, len(data)
    while i < l:
        yield ", ".join(f"0x{b:02X}" for b in data[i:min(j, l)])
        i, j = j, j + w

def build_index_html_c():
    name = "index.html"
    html = f"web/dist/{name}"
    head = f"include/{name}.h"
    code = f"src/{name}.c"

    check = chain(iglob("web/*"), iglob("web/src/*"))
    if all(map(make_change_checker(head, code), check)):
        return

    print("Generating c code for web asset:", name, end="... ")

    if not path.isdir("web/node_modules"):
        call_web("npm", "install")
    call_web("npx", "rollup", "--config")

    with open(html, "rb") as f:
        html = f.read()

    html = compress(html)
    print(len(html), "bytes (gzipped)", end="\n\n")

    vars = {
        "name": name,
        "ident": name.replace(".", "_"),
        "table": ",\n  ".join(bin2hex(html)),
        "length": len(html)
    }

    with open(head, "w") as f:
        f.write(html_h_template.format(**vars))

    with open(code, "w") as f:
        f.write(html_c_template.format(**vars))

build_index_html_c()
