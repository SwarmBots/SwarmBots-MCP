
/**
 * A Mirf example to test the latency between two Ardunio.
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
 * Note: To see best case latency comment out all Serial.println
 * statements not displaying the result and load 
 * 'ping_server_interupt' on the server.
 */

#include <SPI.h>
#include <Mirf.h>
#include <nRF24L01.h>
#include <MirfHardwareSpiDriver.h>

#define MDATA 5
#define MCLK 6
//Clock is white, data is orange.
//Power is blue and ground is green
#define leftMotorOne 3
#define leftMotorTwo 4
#define rightMotorOne 7
#define rightMotorTwo 8

int totalX = 0;
int totalY = 0;
int forwardRemaining = 0;
int source = 0; //First bot
int bot = 4; //t means that this is a bot, f for computer


void gohi(int pin)
{
  pinMode(pin, INPUT);
  digitalWrite(pin, HIGH);
}

void golo(int pin)
{
  pinMode(pin, OUTPUT);
  digitalWrite(pin, LOW);
}

void mouse_write(char data)
{
  char i;
  char parity = 1;
  gohi(MDATA);
  gohi(MCLK);
  delayMicroseconds(300);
  golo(MCLK);
  delayMicroseconds(300);
  golo(MDATA);
  delayMicroseconds(10);
  gohi(MCLK);
  while (digitalRead(MCLK) == HIGH)
    ;
  for (i=0; i < 8; i++) {
    if (data & 0x01) {
      gohi(MDATA);
    } 
    else {
      golo(MDATA);
    }
    while (digitalRead(MCLK) == LOW)
      ;
    while (digitalRead(MCLK) == HIGH)
      ;
    parity = parity ^ (data & 0x01);
    data = data >> 1;
  }  
  if (parity) {
    gohi(MDATA);
  } 
  else {
    golo(MDATA);
  }
  while (digitalRead(MCLK) == LOW)
    ;
  while (digitalRead(MCLK) == HIGH)
    ;
  gohi(MDATA);
  delayMicroseconds(50);
  while (digitalRead(MCLK) == HIGH)
    ;
  while ((digitalRead(MCLK) == LOW) || (digitalRead(MDATA) == LOW))
    ;
  golo(MCLK);
}

char mouse_read(void)
{
  char data = 0x00;
  int i;
  char bit = 0x01;

  //  Serial.print("reading byte from mouse\n");
  /* start the clock */
  gohi(MCLK);
  gohi(MDATA);
  delayMicroseconds(50);
  while (digitalRead(MCLK) == HIGH)
    ;
  delayMicroseconds(5);  /* not sure why */
  while (digitalRead(MCLK) == LOW) /* eat start bit */
    ;
  for (i=0; i < 8; i++) {
    while (digitalRead(MCLK) == HIGH)
      ;
    if (digitalRead(MDATA) == HIGH) {
      data = data | bit;
    }
    while (digitalRead(MCLK) == LOW)
      ;
    bit = bit << 1;
  }
  /* eat parity bit, which we ignore */
  while (digitalRead(MCLK) == HIGH)
    ;
  while (digitalRead(MCLK) == LOW)
    ;
  /* eat stop bit */
  while (digitalRead(MCLK) == HIGH)
    ;
  while (digitalRead(MCLK) == LOW)
    ;

  golo(MCLK);
  return data;
}

void mouse_init()
{
  gohi(MCLK);
  gohi(MDATA);
  mouse_write(0xff);
  mouse_read(); 
  mouse_read();  
  mouse_read();  
  mouse_write(0xf0); 
  mouse_read(); 
}


void setup(){
  Serial.begin(9600);
  mouse_init();
  pinMode(leftMotorOne, OUTPUT);
  pinMode(leftMotorTwo, OUTPUT);
  pinMode(rightMotorOne, OUTPUT);
  pinMode(rightMotorTwo, OUTPUT);
  /*
   * Setup pins / SPI.
   */
   
  /* To change CE / CSN Pins:
   * 
   * Mirf.csnPin = 9;
   * Mirf.cePin = 7;
   */
  /*
  Mirf.cePin = 7;
  Mirf.csnPin = 8;
  */
  Mirf.csnPin = 10;
  Mirf.cePin = 9;
  Mirf.spi = &MirfHardwareSpi;
  Mirf.init();
  
  /*
   * Configure reciving address.
   */
   
  Mirf.setRADDR((byte *)"clie1");  
  Mirf.setTADDR((byte *)"serv1");
  
  /*
   * Set the payload length to sizeof(unsigned long) the
   * return type of millis().
   *
   * NB: payload on c
   lient and server must be the same.
   */
   
  Mirf.payload = sizeof(unsigned long)
  ;
  
  /*
   * Write channel and payload config then power up reciver.
   */
   
  /*
   * To change channel:
   * 
   
   * Mirf.channel = 10;
   
   *
   * NB: Make sure channel is legal in your area.
   */
  Mirf.channel = 2;
  Mirf.config();
  
  Serial.println("Listening... "); 
}



void loop(){
  char mouseX;
  char mouseY;
  
  mouse_write(0xeb);
  mouse_read(); //Throw away acknoledgement of data reciept
  mouse_read(); //Throw away button and wheel info
  mouseX = mouse_read();
  mouseY = mouse_read();
  totalX = totalX + int(mouseX);
  totalY = totalY + int(mouseY);
  
  if (forwardRemaining == 0){
    if(Mirf.dataReady()){
      unsigned long data = 0;
      Serial.print("Got packet ");
      Mirf.getData((uint8_t*) &data);
      unsigned int converted[4];
      converted[0] = (int)((data >> 24) & 0xFF);
      converted[1] = (int)((data >> 16) & 0xFF);
      converted[2] = (int)((data >> 8) & 0xFF);
      converted[3] = (int)(data & 0xFF);
      forwardRemaining = (converted[2]*converted[3])/2;
      
      Serial.println(data);
      unsigned long test = 5678;
      Mirf.send((uint8_t*) &test);
      while(Mirf.isSending()){
      }
      Serial.print("Sent ");
      Serial.println(test);
      Serial.print('\n');
    }
  }
  else {
    digitalWrite(leftMotorOne, HIGH);
    digitalWrite(leftMotorTwo, LOW);
    digitalWrite(rightMotorOne, HIGH);
    digitalWrite(rightMotorTwo, LOW);
    if (totalY >= forwardRemaining){
      forwardRemaining=0;
    }
  }
} 
  
  
  
  