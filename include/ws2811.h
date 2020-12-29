#ifndef __WS2811_H__
#define __WS2811_H__

#define WS2811_NUM_LED 6

#ifdef __cplusplus
extern "C" {
#endif /* __cplusplus */

void ws2811_init(void);

const uint32_t *ws2811_get_colors(void);

void ws2811_set(size_t idx, uint32_t rgb);

void ws2811_flush(void);

#ifdef __cplusplus
}
#endif /* __cplusplus */

#endif /* __WS2811_H__ */
