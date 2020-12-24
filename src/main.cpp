#include <Arduino.h>
#include <ESPAsyncWiFiManager.h>
#include <ESPAsyncWebServer.h>
#include "WS2811.h"
#include "index.html.h"

DNSServer dns;
AsyncWebServer http(80);

void setup(void)
{
	Serial.begin(74880);

	ws2811_init();

	AsyncWiFiManager manager(&http, &dns);
	while (!manager.autoConnect());

	http.on("/", HTTP_GET, [](AsyncWebServerRequest *req) {
		AsyncWebServerResponse *res = req->beginResponse_P(200, "text/html",
				index_html_gzip, index_html_gzip_len);
		res->addHeader("Content-Encoding", "gzip");
		req->send(res);
	});

	http.on("/ws2811", HTTP_GET, [](AsyncWebServerRequest *req) {
		req->send(200, "text/plain", WS2811_NUM_LED_STR);
	});

	http.on("/ws2811", HTTP_POST, [](AsyncWebServerRequest *req) {
		req->send(200);
	}, [](AsyncWebServerRequest *request, String filename, size_t index, uint8_t *data, size_t len, bool final){
	}, [](AsyncWebServerRequest *req, uint8_t *body, size_t len, size_t idx, size_t total) {
		if(!idx){
			Serial.printf("BodyStart: %u B\n", total);
		}
		for(size_t i=0; i<len; i++){
			Serial.write(body[i]);
		}
		if(idx + len == total){
			Serial.printf("BodyEnd: %u B\n", total);
		}
	});

	http.onNotFound([](AsyncWebServerRequest *req) {
		if (req->method() == HTTP_OPTIONS) {
			req->send(200);
		} else {
			req->send(404, "text/plain", "Ohh, something's missing?!");
		}
	});

	DefaultHeaders::Instance().addHeader("Access-Control-Allow-Origin", "*");
	http.begin();
	Serial.print("listenting on http://");
	Serial.println(WiFi.localIP());
}

void loop(void)
{
}
