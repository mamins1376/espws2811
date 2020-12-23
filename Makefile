PIO := pio -c vim
PIO_TARGETS := clean buildfs erase size upload uploadfs uploadfsota

all:
	$(PIO) run

$(PIO_TARGETS)::
	$(PIO) run --target $@

clean::
	rm web/*.{h,c}

monitor:
	$(PIO) device monitor -b 74880

update:
	$(PIO) update
