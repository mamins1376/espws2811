from os import path

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

def call_exec(*args):
    import subprocess
    try:
        subprocess.check_call(args)
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
    html = f"dist/embed.html"
    head = f"include/{name}.h"
    code = f"src/{name}.c"

    if not path.isdir("dist"):
        if not path.isdir("node_modules"):
            call_exec("npm", "install", "--production")
        call_exec("npx", "rollup", "--config")

    if all(map(make_change_checker(head, code), (html, "build.py"))):
        return

    print("Generating c code", end="... ")

    with open(html, "rb") as f:
        html = f.read()
    print(len(html), end=" -> ")

    from gzip import compress
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
