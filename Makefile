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
