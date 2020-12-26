#include <Arduino.h>
#include <ESPAsyncWiFiManager.h>
#include <ESPAsyncWebServer.h>
#include "WS2811.h"
#include "index.html.h"

DNSServer dns;
AsyncWebServer http(80);
AsyncWebSocket ws("/ws");

#define MESSAGE_SERVER_HELLO   'H'
#define MESSAGE_SERVER_INVALID '!'

#define MESSAGE_CLIENT_SET     'S'

static void handleMessage(AsyncWebSocketClient *client, uint8_t *data, size_t len) {
	if (data) {
		const uint8_t command = *(data++); len--;
		if (command == MESSAGE_CLIENT_SET) {
			if (len != 4)
				goto invalid;
			const size_t index = data[0];
			if (index >= WS2811_NUM_LED)
				goto invalid;
			const uint32_t rgb = data[3] << 16 | data[2] << 8 | data[1];
			Serial.printf("setting led@%u to %x\n", index, rgb);
			ws2811_set(index, rgb);
			ws2811_flush();
		} else
			goto invalid;
	} else {
		// this is for when a client gets connected;
		Serial.printf("ws[%u] connected\n", client->id());

		uint8_t buf[2] = { MESSAGE_SERVER_HELLO, WS2811_NUM_LED };
		client->binary(buf, 2);
	}

	return;
invalid:
	Serial.println("invalid message");
	uint8_t buf[1] = { MESSAGE_SERVER_INVALID };
	client->binary(buf, 1);
}

static void onWsEvent(AsyncWebSocket *_server, AsyncWebSocketClient *client, AwsEventType type, void *arg, uint8_t *data, size_t len)
{
	if (type == WS_EVT_CONNECT) {
		handleMessage(client, nullptr, 0);
	} else if (type == WS_EVT_DISCONNECT) {
		Serial.printf("ws[%u] disconnected\n", client->id());
	} else if (type == WS_EVT_ERROR) {
		Serial.printf("ws[%u] error(%u): %s\n", client->id(), *((uint16_t*)arg), (char*)data);
	} else if (type == WS_EVT_DATA) {
		//data packet
		AwsFrameInfo *info = (AwsFrameInfo*)arg;
		if (info->final && info->index == 0 && info->len == len) {
			//the whole message is in a single frame and we got all of it's data
			Serial.printf("ws[%u] %s-message[%llu]: ", client->id(), (info->opcode == WS_TEXT)?"text":"binary", info->len);
			if (info->opcode == WS_BINARY) {
				for (size_t i=0; i < info->len; i++)
					Serial.printf("%02x ", data[i]);
				Serial.printf("\n");
				handleMessage(client, data, len);
			} else {
				data[len] = 0;
				Serial.printf("%s\n", (char*)data);
			}
		} else {
			//message is comprised of multiple frames or the frame is split into multiple packets
			if (info->index == 0) {
				if (info->num == 0)
					Serial.printf("ws[%u] %s-message start\n", client->id(), (info->message_opcode == WS_TEXT)?"text":"binary");
				Serial.printf("ws[%u] frame[%u] start[%llu]\n", client->id(), info->num, info->len);
			}

			Serial.printf("ws[%u] frame[%u] %s[%llu - %llu]: ", client->id(), info->num, (info->message_opcode == WS_TEXT)?"text":"binary", info->index, info->index + len);
			if (info->message_opcode == WS_TEXT) {
				data[len] = 0;
				Serial.printf("%s\n", (char*)data);
			} else {
				for (size_t i=0; i < len; i++)
					Serial.printf("%02x ", data[i]);
				Serial.printf("\n");
			}

			if ((info->index + len) == info->len) {
				Serial.printf("ws[%u] frame[%u] end[%llu]\n", client->id(), info->num, info->len);
				if (info->final) {
					Serial.printf("ws[%u] %s-message end\n", client->id(), (info->message_opcode == WS_TEXT)?"text":"binary");
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

	Serial.println("initializing ws2811");

	AsyncWiFiManager manager(&http, &dns);
	while (!manager.autoConnect());

	ws2811_init();

	http.on("/", HTTP_GET, [](AsyncWebServerRequest *req) {
		AsyncWebServerResponse *res = req->beginResponse_P(200, "text/html",
				index_html_gzip, index_html_gzip_len);
		res->addHeader("Content-Encoding", "gzip");
		req->send(res);
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
