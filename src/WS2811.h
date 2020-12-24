#ifndef __WS2811_H__
#define __WS2811_H__

#define WS2811_NUM_LED 12
#define WS2811_NUM_LED_STR "12"

// TODO: make this faster by increasing table size
static const uint8_t _ws2811_pwm_lookup[] = { 55, 39, 54, 38 };

static HardwareSerial _ws2811_serial = HardwareSerial(UART1);

static uint8_t _ws2811_buf[WS2811_NUM_LED * 12];

static uint8_t _farthest_updated;

static void ws2811_flush(void);

static void ws2811_init(void)
{
	memset(_ws2811_buf, WS2811_NUM_LED * 12, *_ws2811_pwm_lookup);
	_farthest_updated = WS2811_NUM_LED;
	_ws2811_serial = HardwareSerial(UART1);
	_ws2811_serial.begin(3200000, SERIAL_6N1, SERIAL_TX_ONLY);
	Serial.printf("*buf: %u\n", *_ws2811_buf);
	Serial.printf("*last buf: %u\n", _ws2811_buf[WS2811_NUM_LED * 12 - 1]);
	ws2811_flush();
}

static void ws2811_set(size_t idx, uint32_t rgb)
{
	uint8_t *seq = _ws2811_buf + 12 * ++idx;
	for (int i = 0; i < 12; i++) {
		// start from last byte and step down
		*(--seq) = _ws2811_pwm_lookup[rgb & 3];
		rgb >>= 2;
	}

	// we use the increased value
	_farthest_updated = _farthest_updated > idx ? _farthest_updated : idx;
}

static void ws2811_set_range(size_t idx, size_t len, uint32_t rgb)
{
	if (len) {
		ws2811_set(idx, rgb);
		for (size_t d = 12 * (idx + 1); d < 12 * (idx + len); d++)
			_ws2811_buf[d] = _ws2811_buf[d - 12];
		idx += len;
		_farthest_updated = _farthest_updated > idx ? _farthest_updated : idx;
	}
}

static void ws2811_flush(void)
{
	_ws2811_serial.write(_ws2811_buf, _farthest_updated * 12);
	_farthest_updated = 0;
}

static void clear(void) {
	ws2811_set_range(0, WS2811_NUM_LED, 0);
}

#endif /* __WS2811_H__ */
