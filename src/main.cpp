#include <Arduino.h>
#include <ESPAsyncWiFiManager.h>
#include <ESPAsyncWebServer.h>
#include "WS2811.h"
#include "index.html.h"

DNSServer dns;
AsyncWebServer http(80);
AsyncWebSocket ws("/ws");

#define MESSAGE_TYPE_INIT "I"

void onWsEvent(AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type, void *arg, uint8_t *data, size_t len) {
	if (type == WS_EVT_CONNECT) {
		//client connected
		os_printf("ws[%s][%u] connect\n", server->url(), client->id());
		client->printf(MESSAGE_TYPE_INIT WS2811_NUM_LED_STR);
		client->ping();
	} else if (type == WS_EVT_DISCONNECT) {
		os_printf("ws[%s][%u] disconnect: %u\n", server->url(), client->id());
	} else if (type == WS_EVT_ERROR) {
		os_printf("ws[%s][%u] error(%u): %s\n", server->url(), client->id(), *((uint16_t*)arg), (char*)data);
	} else if (type == WS_EVT_DATA) {
		//data packet
		AwsFrameInfo *info = (AwsFrameInfo*)arg;
		if (info->final && info->index == 0 && info->len == len) {
			//the whole message is in a single frame and we got all of it's data
			os_printf("ws[%s][%u] %s-message[%llu]: ", server->url(), client->id(), (info->opcode == WS_TEXT)?"text":"binary", info->len);
			if (info->opcode == WS_TEXT) {
				data[len] = 0;
				os_printf("%s\n", (char*)data);
			} else {
				for(size_t i=0; i < info->len; i++){
					os_printf("%02x ", data[i]);
				}
				os_printf("\n");
			}
			if (info->opcode == WS_TEXT)
				client->text("I got your text message");
			else
				client->binary("I got your binary message");
		} else {
			//message is comprised of multiple frames or the frame is split into multiple packets
			if (info->index == 0) {
				if (info->num == 0)
					os_printf("ws[%s][%u] %s-message start\n", server->url(), client->id(), (info->message_opcode == WS_TEXT)?"text":"binary");
				os_printf("ws[%s][%u] frame[%u] start[%llu]\n", server->url(), client->id(), info->num, info->len);
			}

			os_printf("ws[%s][%u] frame[%u] %s[%llu - %llu]: ", server->url(), client->id(), info->num, (info->message_opcode == WS_TEXT)?"text":"binary", info->index, info->index + len);
			if (info->message_opcode == WS_TEXT) {
				data[len] = 0;
				os_printf("%s\n", (char*)data);
			} else {
				for(size_t i=0; i < len; i++){
					os_printf("%02x ", data[i]);
				}
				os_printf("\n");
			}

			if((info->index + len) == info->len){
				os_printf("ws[%s][%u] frame[%u] end[%llu]\n", server->url(), client->id(), info->num, info->len);
				if(info->final){
					os_printf("ws[%s][%u] %s-message end\n", server->url(), client->id(), (info->message_opcode == WS_TEXT)?"text":"binary");
					if(info->message_opcode == WS_TEXT)
						client->text("I got your text message");
					else
						client->binary("I got your binary message");
				}
			}
		}
	}
}

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

	ws.onEvent(onWsEvent);
	http.addHandler(&ws);

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
