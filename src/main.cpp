#include <Arduino.h>
#include <ESPAsyncWiFiManager.h>
#include <ESPAsyncWebServer.h>
#include "index.html.h"

DNSServer dns;
AsyncWebServer http(80);

void setup(void)
{
	Serial.begin(74880);

	AsyncWiFiManager manager(&http, &dns);
	while (!manager.autoConnect());

	http.on("/", HTTP_GET, [](AsyncWebServerRequest *req) {
		AsyncWebServerResponse *res = req->beginResponse_P(200, "text/html",
				index_html_gzip, index_html_gzip_len);
		res->addHeader("Content-Encoding", "gzip");
		req->send(res);
	});

	http.onNotFound([](AsyncWebServerRequest *req) {
		req->send(404, "text/plain", "Ohh, something's missing?!");
	});

	http.begin();
	Serial.print("listenting on http://");
	Serial.println(WiFi.localIP());
}

void loop(void)
{
}
