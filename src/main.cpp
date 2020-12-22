#include <Arduino.h>
#include <ESPAsyncWiFiManager.h>
#include <ESPAsyncWebServer.h>

DNSServer dns;
AsyncWebServer http(80);

void setup(void)
{
	Serial.begin(74880);

	AsyncWiFiManager manager(&http, &dns);
	while (!manager.autoConnect());

	http.on("/", HTTP_GET, [](AsyncWebServerRequest *req) {
		req->send(200, "text/plain", "Welcome.");
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
