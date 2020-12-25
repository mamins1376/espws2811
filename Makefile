PIO := pio -c vim
PIO_TARGETS := clean buildfs erase size upload uploadfs uploadfsota

all:
	$(PIO) run

$(PIO_TARGETS)::
	$(PIO) run --target $@

clean::
	rm include/*.html.h
	rm src/*.html.h

monitor:
	$(PIO) device monitor -b 74880

update:
	$(PIO) update

nodemon:
	nodemon -w web -w rollup.config.js -w build.py \
		-e js,jsx,scss,py -x python3 build.py
