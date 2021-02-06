---
title: 6.08 Snooz.io
published: 2020-03-9
author: raytran
thumbnail: 608-snoozio/608-thumbnail.png
summary: The alarm clock that hurts you
layout: blog
tags: classwork, website, physical-object
---


<div class="mt-10 alert alert-primary" role="alert">
  <h4 class="alert-heading">Note</h4>
    This project is a final group project for <a href="https://iesc.io/608/S20">6.08 Embedded Systems</a> from Spring 2020. The following write-up is taken directly from the final submission.
    Per course policy, I am not able to provide source code.
</div>





# snooz.io: An Alarm Clock, But It Gets Worse
## Shayna Ahteck, Cami Mejia, Aiden Padilla, Raymond Tran

Meet **snooz.io**: the alarm clock that takes the phrase "You snooze, you lose" a bit too seriously.

[snooz.io](http://608dev-2.net/sandbox/sc/team112/server_test/snooziotesthtml.html) is a customizable alarm clock with a unique randomized, tiered punishment system and creative deactivation features that motivate users to wake up on time. Through a web application, the user creates account linked to their given alarm clock, and can customize the alarm time, timezone, as well as snooze length. For an extra bit of fun, the user can download a script that gives the alarm clock the ability to post onto your Facebook as an extra punishment.


### Demonstration
<div style="position: relative; width:100%; height:0; padding-bottom: 56.25%;">
<iframe src="https://www.youtube.com/embed/jia24XHIY40" 
frameborder="0" allowfullscreen style="position: absolute; top:0; left: 0; width:100%; height:100%;"></iframe>
</div>

# Functionality

## The Web Application

The web application should be used to create a user account and edit the alarm clock settings of said user. Once information is edited on the webapp, changes should be reflected immediately on the physical alarm clock's screen. The web application is also where users can upload a picture that can be utilized in a later punishment.

## Tiers and Punishments
The alarm clock will feature a four tiered punishment system. Each punishment will apply to the next ring, either replacing the alarm clock noise or following it.
* **Tier 0**: basic alarm clock noise
    * will increase tiers after 1 total snooze(s)
* **Tier 1**: songs and obnoxious music
    * will randomly choose a song/noise from a preset playlist
    * will increase tier after 2 total snooze(s)
* **Tier 2**: text to speech insults
    * will wake you up via insults rather than the alarm clock noise
    * will increase tier after 3 total snooze(s)
* **Tier 3**: chance of either meme music or Facebook posts
    * only tier with a chance of either 1) playing obnoxious music or 2) posting to your FB
    * if you hear meme music, this means you're safe from facebook posting
    * if it's the normal alarm clock noise, but you have three total snoozes already, this means it is currently posting to your Facebook.
    * this is the final tier

## Deactivation Methods
There are three different deactivation methods that you can choose from. To trigger deactivation mode, the user must stand on a pressure plate.
1. **Speech to Text**
   In this mode, a phrase will be randomly picked from our phrase bank (which is just a series of Kanye West quotes). The user must then recite this phrase into the microphone on the alarm clock. If the phrase matches the phrase displayed on the screen, the alarm clock will then turn off.
2. **Trivia Mode**
   In this mode, a random trivia question will be given to the user. The user must orrectly solve this trivia question in order to turn off the alarm. If the user answers the question incorrectly, another question is given to the user, and so on, until the user finally gets the question correct.
3. **Maze Mode**
   In this mode, a randomly generated maze will be given to the user. The user has forty-five seconds to complete the maze. The ball in the maze can be controlled by tilting the alarm clock. If the user fails to complete the maze in time, another maze is generated and give nto the user, and so on, until the user is finally successful. Once successful, the alarm clock will shut off.

## System Diagram

<img alt="System diagram" src="https://i.imgur.com/h11ayXl.png" style="width:100%"/>

# Parts List
* Speaker, Amplifier, and SD Card Reader
* DIY Pressure Plate Mat
* IMU
* Microphone
* TFT display
* Buttons
* ESP32

# Code and Design

## Server Side

### Web Application
The web application features three different pages that the user can access: the login page, the account creation page, and the settings page.

The main Python code for the web application handles a series of different GET and POST requests that directs the script what to do.

| Query | Request Type | Function |
|--------------------|-------------|--------------------------------------------------------------------------------------|
| ?status | POST | This indicates the user is attempting to login. It will generate a session ID for the user. If the username and password is successful, it will take the user to the settings page. If the password is incorrect, it won't log the user in. If it can't match the username to a username in the database, it won't log the user in and directs the user to the account creation page. |
| ?create | POST | This query is submitted by the form on the account creation page. This checks if the username already exists within the database. If it does, the script notifies the user it must choose a different username. If not, the username and password is added into the database and the user is redirected to the login page. |
| ?snooze | POST | This indicates the user has hit snooze on the alarm. This updates the number of snoozes stored in the database. |
| ?punish | POST | This checks the number of snoozes currently stored in the database associated with the username. Based on the number of snoozes, the server responds with a keyword that the ESP32 interprets to determine what punishment to give the user. |
| ?update | POST | This sends the ESP32 information on what deactivation method is chosen for the alarm clock. |
| ?time | POST | This grabs the timezone from the user and returns the proper, converted time to the alarm clock. |
|?deactivate | POST | This is sent when the user has successfully deactivated the alarm clock, resetting snooze count to zero.
| no query specified | POST | This updates the page when changes are made to the alarm clock settings, so that it always displays the most recent changes. |

### Pressure Plate

The pressure plate mat is a DIY capacitive sensor made out of cardboard, aluminum foil, tape, and wires. Its structure is like a taped-together sandwich, with the layers as follows:
* Cardboard
* Aluminum foil
* Cardboard spacers
* Aluminum foil
* Cardboard

One wire connects the top foil layer to pin 17, the other wire connects the bottom foil layer to ground. Despite its simple structure, it is a resuable device that stands up to repeated pressure and returns to its unpressed state. The pressure plate acts like a button when the user steps on it, triggering the deactivation sequence.

### Facebook Script
Since Facebook removed the ability to create posts on users' walls in their API, in order for the Facebook punishments to work, the user has to keep a python script running on their computer. The python script uses a headless web browser to interface with the Facebook website.

On the 608 server, users can upload embarrasing images of themselves that will later be posted to Facebook. When it's time for the alarm to ring, the python script will retrieve the images and perform the post onto the user's wall.


### Twitter Script
The server-side file twitter_handler.py takes in a POST request with the parameters of:
* username
* a random number from 1 to 12 inclusive
* the number of times the snooze button has been hit.

The handler selects a tweet message from a database tweets.db, corresponding to the random number. The handler then returns the message along with the line “USER has hit the snooze button x times.”, with USER replaced by the username and x replaced by the number of times the snooze button has been hit.

If the database is empty (first call), it populates the database tweets.db with the 12 tweet templates.
## The Alarm Clock

## Punishments

### Music and Text to Speech

The audio-based punishments are selected from the punishment database according to the punishment tier. The SD card is pre-populated with the audio files and accessed according to what punishment is selected. The ESP32 plays back the appropriate file.

| SD Card Folder | Tier | Files |
|------------|------------|----------|
| 01 | Tier 1 | Increasing Tone or Sirens|
| 02 | Tier 2 | One of 8 Text-To-Speech Insults|
| 03 | Tier 3 | Meme Music (Rickroll, Call Me Maybe, Crab Rave, Megalovania, others)|
| 04 | Tier 0 | Calm Alarm Sound|

### Facebook Posts
Upon triggering this punishment, the server immediately updates the database for the python script to read from, causing the post to occur.


### Twitter Posts
Upon triggering this punishment, the screen displays a threat to "Get up now, or I'm tweeting." There is a 10 second countdown displayed. If the user does not trigger the deactivation sequence within this 10 second countdown, one of 12 random Tweet templates is chosen, populated with user information (user name, number of times snoozed) and tweeted to the user's connected Twitter account

## Deactivation Methods

### Speech to Text
The user presses the first button to trigger the deactivation sequence. The screen displays a sentence. The user then stands on the pressure plate, which begins recording their voice. They must say the phrase displayed on the screen. The recording is sent to the speech-to-text service, then compared against the original phrase. If it is a good enough match, the alarm is deactivated.

### Maze

The user can tilt their block player around to solve a generated maze displayed on the TFT screen. Upon succesfully reaching the end location, the alarm is deactivated.

Mazes are randomly generated using a modified depth first search.
The maze is defined as a 2D array of integers, with 0 as empty, 1 as a wall, 2 as the player location, and 3 as the goal location. The board is initialized to be entirely full of walls. The ESP32 uses depth first search from a random starting location to "carve-out" a maze.

Neighbors are selected in a random order (NORTH, EAST, SOUTH, WEST), in order to ensure a random-looking maze.

High-level pseudo code:

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
define DFS(cell):
    for each neighbor of cell that is 2 blocks away:
        if neighbor is WALL:
            set neighbor = EMPTY
            set (cell between current and neighbor) = EMPTY
            DFS(neighbor)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Notice that we move by 2 steps rather than by 1 in order to ensure that we create walls (instead of searching every cell).

After the maze is generated, the first blank cell from each corner is selected as starting and end locations.

Movement of the player is done similarly to the etch-a-sketch design exercise, where we read accelerometer data and check if the player can move into another empty cell.

### Trivia

The user can answer a trivia question. If answered correctly, the alarm is deactivated.

This features uses the open-trivia API to display a trivia question and possible answers. The user uses the first button to toggle through the possible answers and the second button to select their answer choice. If incorrectly answered, another question is displayed. If correctly answered, the function returns a specific value, which then deactivates the alarm clock.

# File Descriptions

## Arduino
**Snoozio.ino** The main file containing most of the alarm clock structure, including the connection to WiFi, clock and alarm display, alarm finite state machine calling the appropriate punishment, and other helping functions.

**maze.ino** This file controls the maze deactivation sequence's generation, player movement, and monitors when the success state is reached.

**speech_to_text.ino** This file allows for the speech-to-text deactivation sequence to pass the recorded audio file to the speech-to-text API and compare against the selected/displayed phrase to see if it is a good enough match.

**supportfunctions.ino** Functions to support the clock, speech-to-text, and HTTP requests.

## Python
**snooziotest.py**: This communicates with the ESP32 and the database, updating and sending information between the two of them.

**twitter_handler.py** This handles the Twitter-related punishment by selecting and composing a Tweet from a database tweets.db

## HTML + CSS
**snooziotesthtml.html**: This is the home page/login page.

**snooziotestcreate.html**: This is the account creation page.

**styles.css**: This sets the CSS for the pages.
# Database
Stores users' information and set data in the following variables:

| Entry name |  Type | Utility |
|------------|------------|-----|
| username |  text |User's chosen name
| password |  text |User's hashed password
| alarm |  datetime |Set alarm time
| snooze  | int |Current snooze count
| status | boolean |True if alarm is enabled
| snooze_time | int | Duration of snooze
| time_zone | text| Set time zone
|deactivate_method| text | Method of deactivation

# Past Milestones
We organized our milestones pretty intuitively, first working on creating a basic skeleton, integrating the different parts together, and then working on punishments. Then once these were done, we implemented additional features we had come up with along the way.
## Week 1: The Skeleton
During the first week, we focused on making a functioning alarm clock, as we believed it was a fitting place to start. We thought that if we succeeded at getting this very basic skeleton done, we would be able to use later weeks to build upon and modify what we've made. We set out with a very specific model in mind: an alarm clock that can be controlled by a webapp and deactivated with a pressure plate. However, we wanted to just work on these individual pieces first, rather than using this first week to make AND implement everything.

## The pressure plate
<div style="position: relative; width:100%; height:0; padding-bottom: 56.25%;">
<iframe src="https://www.youtube.com/embed/ePINKAeomzA" 
frameborder="0" allowfullscreen style="position: absolute; top:0; left: 0; width:100%; height:100%;"></iframe>
</div>

## The alarm clock 
<div style="position: relative; width:100%; height:0; padding-bottom: 56.25%;">
<iframe src="https://www.youtube.com/embed/eSbfQ7fxSTo" 
frameborder="0" allowfullscreen style="position: absolute; top:0; left: 0; width:100%; height:100%;"></iframe>
</div>


## The webapp
<div style="position: relative; width:100%; height:0; padding-bottom: 56.25%;">
<iframe src="https://www.youtube.com/embed/c9gUS6XQ914" 
frameborder="0" allowfullscreen style="position: absolute; top:0; left: 0; width:100%; height:100%;"></iframe>
</div>

In this first week, we had also already outlined basic punishment features we wanted in our alarm clock as well as how deactivation would work. Since parts wouldn't arrive until much later, we wanted to utilize this time to do all the things we could do, such as doing the second part of the deactivation method: speech to text.

## Speech to text deactivation
<div style="position: relative; width:100%; height:0; padding-bottom: 56.25%;">
<iframe src="https://www.youtube.com/embed/xF-02kP3Qnc" 
frameborder="0" allowfullscreen style="position: absolute; top:0; left: 0; width:100%; height:100%;"></iframe>
</div>

## Week 2: Integration
During this second week, our parts hadn't arrived yet, but we still wanted to accomplish certain things. Thus, we dedicated the week to integrating the parts from our first week, as well as now studying and working on punishment features that didn't involve the missing parts: social media.

### Communication between ESP32 + server
<div style="position: relative; width:100%; height:0; padding-bottom: 56.25%;">
<iframe src="https://www.youtube.com/embed/XJ_CGR7l7kU" 
frameborder="0" allowfullscreen style="position: absolute; top:0; left: 0; width:100%; height:100%;"></iframe>
</div>

### Pressure plate deactivation
<div style="position: relative; width:100%; height:0; padding-bottom: 56.25%;">
<iframe src="https://www.youtube.com/embed/XNq-6N0mDuY" 
frameborder="0" allowfullscreen style="position: absolute; top:0; left: 0; width:100%; height:100%;"></iframe>
</div>

### Facebook posting
<div style="position: relative; width:100%; height:0; padding-bottom: 56.25%;">
<iframe src="https://www.youtube.com/embed/Ds6EPyNgpX8" 
frameborder="0" allowfullscreen style="position: absolute; top:0; left: 0; width:100%; height:100%;"></iframe>
</div>

### Twitter posting
<div style="position: relative; width:100%; height:0; padding-bottom: 56.25%;">
<iframe src="https://www.youtube.com/embed/m2cXAAxV31A" 
frameborder="0" allowfullscreen style="position: absolute; top:0; left: 0; width:100%; height:100%;"></iframe>
</div>

## Week 3: Audio and Additions
Unsure if the parts would arrive on time, we all tried our best to work with what we could. We focused on touch-ups and additional features, since we couldn't work on the other punishments since they required the parts. The parts then arrived that Tuesday, so we were able to implement some audio features, but also got new deactivation methods and a nicer looking webapp.

### Improved webapp
<div style="position: relative; width:100%; height:0; padding-bottom: 56.25%;">
<iframe src="https://www.youtube.com/embed/4mzZdwsf_0Y" 
frameborder="0" allowfullscreen style="position: absolute; top:0; left: 0; width:100%; height:100%;"></iframe>
</div>

### New maze deactivation method
<div style="position: relative; width:100%; height:0; padding-bottom: 56.25%;">
<iframe src="https://www.youtube.com/embed/OacnRwTp0j8" 
frameborder="0" allowfullscreen style="position: absolute; top:0; left: 0; width:100%; height:100%;"></iframe>
</div>

### Audio demonstration
<div style="position: relative; width:100%; height:0; padding-bottom: 56.25%;">
<iframe src="https://www.youtube.com/embed/islVHL0O85k" 
frameborder="0" allowfullscreen style="position: absolute; top:0; left: 0; width:100%; height:100%;"></iframe>
</div>

## Week 4: Final touches
Finally, week 4 was dedicated to once again implementing all of these additional parts.

### Facebook punishment
<div style="position: relative; width:100%; height:0; padding-bottom: 56.25%;">
<iframe src="https://www.youtube.com/embed/_xvOW80lT0I" 
frameborder="0" allowfullscreen style="position: absolute; top:0; left: 0; width:100%; height:100%;"></iframe>
</div>

### Trivia deactivation method
<div style="position: relative; width:100%; height:0; padding-bottom: 56.25%;">
<iframe src="https://www.youtube.com/embed/WICXZezQxLI" 
frameborder="0" allowfullscreen style="position: absolute; top:0; left: 0; width:100%; height:100%;"></iframe>
</div>

### Maze deactivation method integrated
<div style="position: relative; width:100%; height:0; padding-bottom: 56.25%;">
<iframe src="https://www.youtube.com/embed/EADwA7QUaTU" 
frameborder="0" allowfullscreen style="position: absolute; top:0; left: 0; width:100%; height:100%;"></iframe>
</div>

We also worked on just making it more intuitive and tightening up some things we had discussed previously, like password encryption.

### Encryption
<div style="position: relative; width:100%; height:0; padding-bottom: 56.25%;">
<iframe src="https://www.youtube.com/embed/vUlGZvqrOZI" 
frameborder="0" allowfullscreen style="position: absolute; top:0; left: 0; width:100%; height:100%;"></iframe>
</div>

Ultimately, we weren't able to get Twitter to work, but Facebook was successful so it was good since we had one social media we could work with!
# Team Members
* Shayna Ahteck
* Cami Mejia
* Aiden Padilla
* Raymond Tran

