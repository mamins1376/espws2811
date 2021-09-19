#include <esp8266_peri.h>
#include <uart.h>
#include <osapi.h>
#include "ws2811.h"

static uart_t *ws2811_uart;

// TODO: make this faster by increasing table size
static uint32_t ws2811_colorbuf[WS2811_NUM_LED];

static char ws2811_protobuf[WS2811_NUM_LED * 12];

static uint8_t farthest_updated;

static void ws2811_set_raw(size_t idx, uint32_t rgb)
{
	const char table[] = { 0x37, 0x27, 0x36, 0x26 };
	char *const buf = ws2811_protobuf + 12 * idx;
	for (char *seq = buf + 12; seq > buf; rgb >>= 2)
		*(--seq) = table[rgb & 3];
}

static void ws2811_set_range(size_t idx, size_t len, uint32_t rgb)
{
	if (!len)
		return;
	ws2811_set_raw(idx, rgb);
	const size_t end = idx + len;
	for (size_t d = idx; d < end; d++)
		ws2811_colorbuf[d] = rgb;
	for (size_t d = 12 * ++idx; d < 12 * end; d++)
		ws2811_protobuf[d] = ws2811_protobuf[d - 12];
	farthest_updated = farthest_updated > end ? farthest_updated : end;
}

static void ws2811_clear(void) {
	ws2811_set_range(0, WS2811_NUM_LED, 0);
}

void ws2811_init(void)
{
	ws2811_clear();

	ws2811_uart = uart_init(UART1, 3200000, UART_6N1, UART_TX_ONLY, 0, 0, true);
	USC0(UART1) |= BIT(UCTXI);
	os_delay_us(60);
	ws2811_flush();
}

void ws2811_set(size_t idx, uint32_t rgb)
{
	ws2811_set_raw(idx, rgb);
	ws2811_colorbuf[idx++] = rgb;
	farthest_updated = farthest_updated > idx ? farthest_updated : idx;
}

void ws2811_flush(void)
{
	uart_write(ws2811_uart, ws2811_protobuf, farthest_updated * 12);
	farthest_updated = 0;
}

const uint32_t *ws2811_get_colors(void)
{
	return ws2811_colorbuf;
}
