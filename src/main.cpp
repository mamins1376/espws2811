#include "Arduino.h"

void setup()
{
	pinMode(LED_BUILTIN, OUTPUT);
}

void loop()
{
	static bool state = false;
	state = !state;
	digitalWrite(LED_BUILTIN, state ? HIGH : LOW);
	delay(1000);
}
