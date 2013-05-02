/**
 * An Mirf example which copies back the data it recives.
 *
 * Pins:
 * Hardware SPI:
 * MISO -> 12
 * MOSI -> 11
 * SCK -> 13
 *
 * Configurable:
 * CE -> 8
 * CSN -> 7
 *
 */

#include <SPI.h>
#include <Mirf.h>
#include <nRF24L01.h>
#include <MirfHardwareSpiDriver.h>

void setup(){
  Serial.begin(9600);
  
  /*
   * Set the SPI Driver.
   */
  Mirf.csnPin = 10;
  Mirf.cePin = 9;
  
  Mirf.spi = &MirfHardwareSpi;
  
  /*
   * Setup pins / SPI.
   */
   
  Mirf.init();
  
  /*
   * Configure reciving address.
   */
   
  Mirf.setRADDR((byte *)"serv1");
  
  /*
   * Set the payload length to sizeof(unsigned long) the
   * return type of millis().
   *
   
   * NB: payload on client and server must be the same.
   */
   
  Mirf.payload = sizeof(unsigned long);
  
  /*
   * Write channel and payload config then power up reciver.
   */
  Mirf.channel = 2;
  
  Mirf.config();
  
  Serial.println("Listening..."); 
}


void loop(void)
{
  String readString = "";  
  if (Serial.available()){
    while (Serial.available()) {
      //printf("hey ");
      delay(3);  //delay to allow buffer to fill 
      if (Serial.available() >0) {
        char c = Serial.read();  //gets one byte from serial buffer
        readString += c; //makes the string readString
      } 
    }
    String message = readString;
    char smessage[4];
    message.toCharArray(smessage, sizeof(message));


    Mirf.setTADDR((byte *)"clie1");
    Mirf.send((uint8_t*) smessage);

    uint8_t getget[4] = {'0','0','0','0'};

    unsigned long time = millis();
    // Wait here until we get a response, or timeout (250ms)
    while(!Mirf.dataReady()){
      //Serial.println("Waiting");
      if ( ( millis() - time ) > 1000 ) {
        return;
      }
    }
    
    Mirf.getData(getget);
    Serial.println((char*) getget);

  }
}
