#include <uart.h>

#ifndef __WS2811_H__
#define __WS2811_H__

#define WS2811_NUM_LED 6

static uart_t *_ws2811_uart;

// TODO: make this faster by increasing table size
static uint32_t _ws2811_colorbuf[WS2811_NUM_LED];

static char _ws2811_protobuf[WS2811_NUM_LED * 12];

static uint8_t _farthest_updated;

static void _ws2811_set_raw(size_t idx, uint32_t rgb)
{
	const char table[] = { 55, 39, 54, 38 };
	char *const buf = _ws2811_protobuf + 12 * idx;
	for (char *seq = buf + 12; seq > buf; rgb >>= 2)
		*(--seq) = table[rgb & 3];
}

static void ws2811_set(size_t idx, uint32_t rgb)
{
	_ws2811_set_raw(idx, rgb);
	_ws2811_colorbuf[idx++] = rgb;
	_farthest_updated = _farthest_updated > idx ? _farthest_updated : idx;
}

static void ws2811_set_range(size_t idx, size_t len, uint32_t rgb)
{
	if (!len)
		return;
	_ws2811_set_raw(idx, rgb);
	const size_t end = idx + len;
	for (size_t d = idx; d < end; d++)
		_ws2811_colorbuf[d] = rgb;
	for (size_t d = 12 * ++idx; d < 12 * end; d++)
		_ws2811_protobuf[d] = _ws2811_protobuf[d - 12];
	_farthest_updated = _farthest_updated > end ? _farthest_updated : end;
}

static void ws2811_clear(void) {
	ws2811_set_range(0, WS2811_NUM_LED, 0);
}

static void ws2811_flush(void)
{
	uart_write(_ws2811_uart, _ws2811_protobuf, _farthest_updated * 12);
	_farthest_updated = 0;
}

static void ws2811_init(void)
{
	ws2811_clear();
	Serial.printf("*buf start: %i\n", _ws2811_protobuf[0]);
	Serial.printf("*buf end: %i\n", _ws2811_protobuf[WS2811_NUM_LED * 12 - 1]);
	Serial.printf("sys freq: %uMHz\n", system_get_cpu_freq());

	_ws2811_uart = uart_init(UART1, 3200000, UART_6N1, UART_TX_ONLY, 0, 0, true);
	USC0(UART1) = USC0(UART1) | BIT(UCTXI);
	os_delay_us(60);
	ws2811_flush();
}

#endif /* __WS2811_H__ */
