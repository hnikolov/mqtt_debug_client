/*******************************************************************************
 * Copyright (c) 2015 IBM Corp.
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * and Eclipse Distribution License v1.0 which accompany this distribution.
 *
 * The Eclipse Public License is available at
 *    http://www.eclipse.org/legal/epl-v10.html
 * and the Eclipse Distribution License is available at
 *   http://www.eclipse.org/org/documents/edl-v10.php.
 *
 * Contributors:
 *    James Sutton - Initial Contribution
 *    Hristo Nikolov - "home_mqtt" application customization
 *******************************************************************************/

/*
Eclipse Paho MQTT-JS Utility
This utility can be used to test the Eclipse Paho MQTT Javascript client.
*/

// Create a client instance
client = null;

connected = false;
      
// Called when the client connects
function onConnect(context) {
  // Once a connection has been made, make a subscription and send a message.
  console.log("Client Connected");
  var statusSpan = document.getElementById("connectionStatus");
  statusSpan.innerHTML = "Connected to: " + context.invocationContext.host + ':' + context.invocationContext.port + context.invocationContext.path + ' as ' + context.invocationContext.clientId;
  connected = true;
  setFormEnabledState(true);
  $('#serverCollapse').collapse('hide');
  subscribe();
}

function onFail(context) {
  console.log("Failed to connect");
  var statusSpan = document.getElementById("connectionStatus");
  statusSpan.innerHTML = "Failed to connect: " + context.errorMessage;
  connected = false;
  setFormEnabledState(false);
}

// called when the client loses its connection
function onConnectionLost(responseObject) {
  if (responseObject.errorCode !== 0) {
    console.log("Connection Lost: " + responseObject.errorMessage);
    var statusSpan = document.getElementById("connectionStatus");
    statusSpan.innerHTML = "Connection Lost: " + responseObject.errorMessage;
  }
  connected = false;
}

// Called when a message arrives
function onMessageArrived(message) {
  console.log('Message Recieved: Topic: ', message.destinationName, '. Payload: ', message.payloadString, '. QoS: ', message.qos);
  console.log(message);
  
  var msg_time = new Date();
  var str_msg_time = get_time_str(msg_time);
  
  // Insert into History Table
  var table = document.getElementById("incomingMessageTable").getElementsByTagName('tbody')[0];
  var row = table.insertRow(0);
  row.insertCell(0).innerHTML = message.destinationName;
  row.insertCell(1).innerHTML = safe_tags_regex(message.payloadString);
  row.insertCell(2).innerHTML = str_msg_time;
  row.insertCell(3).innerHTML = message.qos;

  var updated = updateKnown(message, msg_time);
  if (updated) { return; }
    
  if(!document.getElementById(message.destinationName)) {
    // Insert into Last Message Table
    var lastMessageTable = document.getElementById("lastMessageTable").getElementsByTagName('tbody')[0];
    var newlastMessageRow = lastMessageTable.insertRow(0);
    newlastMessageRow.id = message.destinationName;
    newlastMessageRow.insertCell(0).innerHTML = message.destinationName;
    newlastMessageRow.insertCell(1).innerHTML = safe_tags_regex(message.payloadString);
    newlastMessageRow.insertCell(2).innerHTML = str_msg_time;
    newlastMessageRow.insertCell(3).innerHTML = message.qos;
  } 
  else 
  {
    // Update Last Message Table
    var lastMessageRow = document.getElementById(message.destinationName);
    lastMessageRow.id = message.destinationName;
    lastMessageRow.cells[0].innerHTML = message.destinationName;      
    lastMessageRow.cells[1].innerHTML = safe_tags_regex(message.payloadString);
    lastMessageRow.cells[2].innerHTML = str_msg_time;
    lastMessageRow.cells[3].innerHTML = message.qos;
  }
}

function connectionToggle() {
  if(connected) { disconnect(); }
  else          { connect();    }
}

function connect(){
  var hostname = document.getElementById("hostInput").value;
  var port = document.getElementById("portInput").value;
  var clientId = document.getElementById("clientIdInput").value;

  var path = document.getElementById("pathInput").value;
  var user = document.getElementById("userInput").value;
  var pass = document.getElementById("passInput").value;
  var keepAlive = Number(document.getElementById("keepAliveInput").value);
  var timeout = Number(document.getElementById("timeoutInput").value);
  var ssl = document.getElementById("sslInput").checked;
  var cleanSession = document.getElementById("cleanSessionInput").checked;
  var lastWillTopic = document.getElementById("lwtInput").value;
  var lastWillQos = Number(document.getElementById("lwQosInput").value);
  var lastWillRetain = document.getElementById("lwRetainInput").checked;
  var lastWillMessage = document.getElementById("lwMInput").value;

  if(path.length > 0) { client = new Paho.MQTT.Client(hostname, Number(port), path, clientId); }
  else                { client = new Paho.MQTT.Client(hostname, Number(port),       clientId); }
  
  console.info('Connecting to Server: Hostname: ', hostname, '. Port: ', port, '. Path: ', client.path, '. Client ID: ', clientId);

  // set callback handlers
  client.onConnectionLost = onConnectionLost;
  client.onMessageArrived = onMessageArrived;

  var options = {
    invocationContext: {host : hostname, port: port, path: client.path, clientId: clientId},
    timeout: timeout,
    keepAliveInterval:keepAlive,
    cleanSession: cleanSession,
    useSSL: ssl,
    onSuccess: onConnect,
    onFailure: onFail
  };

  if(user.length > 0) { options.userName = user; }
  if(pass.length > 0) { options.password = pass; }

  if(lastWillTopic.length > 0){
    var lastWillMessage = new Paho.MQTT.Message(lastWillMessage);
    lastWillMessage.destinationName = lastWillTopic;
    lastWillMessage.qos = lastWillQos;
    lastWillMessage.retained = lastWillRetain;
    options.willMessage = lastWillMessage;
  }

  // connect the client
  client.connect(options);
  var statusSpan = document.getElementById("connectionStatus");
  statusSpan.innerHTML = 'Connecting...';
}

function disconnect(){
  console.info('Disconnecting from Server');
  client.disconnect();
  var statusSpan = document.getElementById("connectionStatus");
  statusSpan.innerHTML = 'Connection - Disconnected.';
  connected = false;
  setFormEnabledState(false);
}

// Sets various form controls to either enabled or disabled
function setFormEnabledState(enabled) {
  // Connection Panel Elements
  if(enabled) { document.getElementById("clientConnectButton").innerHTML = "Disconnect"; }
  else        { document.getElementById("clientConnectButton").innerHTML = "Connect";    }
  
  document.getElementById("hostInput").disabled           = enabled;
  document.getElementById("portInput").disabled           = enabled;
  document.getElementById("clientIdInput").disabled       = enabled;
  document.getElementById("pathInput").disabled           = enabled;
  document.getElementById("userInput").disabled           = enabled;
  document.getElementById("passInput").disabled           = enabled;
  document.getElementById("keepAliveInput").disabled      = enabled;
  document.getElementById("timeoutInput").disabled        = enabled;
  document.getElementById("sslInput").disabled            = enabled;
  document.getElementById("cleanSessionInput").disabled   = enabled;
  document.getElementById("lwtInput").disabled            = enabled;
  document.getElementById("lwQosInput").disabled          = enabled;
  document.getElementById("lwRetainInput").disabled       = enabled;
  document.getElementById("lwMInput").disabled            = enabled;

  // Publish Panel Elements
  document.getElementById("publishTopicInput").disabled   = !enabled;
  document.getElementById("publishQosInput").disabled     = !enabled;
  document.getElementById("publishMessageInput").disabled = !enabled;
  document.getElementById("publishButton").disabled       = !enabled;
  document.getElementById("publishRetainInput").disabled  = !enabled;

  // Subscription Panel Elements
  document.getElementById("subscribeTopicInput").disabled = !enabled;
  document.getElementById("subscribeQosInput").disabled   = !enabled;
  document.getElementById("subscribeButton").disabled     = !enabled;
  document.getElementById("unsubscribeButton").disabled   = !enabled;
}

function publish() {
  var topic = document.getElementById("publishTopicInput").value;
  var qos = document.getElementById("publishQosInput").value;
  var message = document.getElementById("publishMessageInput").value;
  var retain = document.getElementById("publishRetainInput").checked
  console.info('Publishing Message: Topic: ', topic, '. QoS: ' + qos + '. Message: ', message);
  message = new Paho.MQTT.Message(message);
  message.destinationName = topic;
  message.qos = Number(qos);
  message.retained = retain;
  client.send(message);
}

function subscribe() {
  var topic = document.getElementById("subscribeTopicInput").value;
  var qos = document.getElementById("subscribeQosInput").value;   
  console.info('Subscribing to: Topic: ', topic, '. QoS: ', qos);
  client.subscribe(topic, {qos: Number(qos)});
}

function unsubscribe() {
  var topic = document.getElementById("subscribeTopicInput").value;
  console.info('Unsubscribing from ', topic);
  client.unsubscribe(topic, {
       onSuccess: unsubscribeSuccess,
       onFailure: unsubscribeFailure,
       invocationContext: {topic : topic}
   });
}

function unsubscribeSuccess(context) { console.info('Successfully unsubscribed from ', context.invocationContext.topic); }
function unsubscribeFailure(context) { console.info('Failed to unsubscribe from ',     context.invocationContext.topic); }

function clearHistory() {
  var table = document.getElementById("incomingMessageTable");
  //or use :  var table = document.all.tableid;
  for(var i = table.rows.length - 1; i > 0; i--)
  {
      table.deleteRow(i);
  }
}

// Just in case someone sends html
function safe_tags_regex(str) { 
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Used with formatting the time below
function addZero(x, n) {
  while (x.toString().length < n) { x = "0" + x; }
  return x;
}

function get_time_str(d) {
  var h = addZero(d.getHours(), 2);
  var m = addZero(d.getMinutes(), 2);
  var s = addZero(d.getSeconds(), 2);
  var ms = addZero(d.getMilliseconds(), 3);
  return d.toDateString() + " - " + h + ":" + m + ":" + s + " - " + ms;
}

var chart_t, chart_e, chart_w, chart_g;
var dataPoints_t = [], dataPoints_e = [], dataPoints_w = [], dataPoints_g = [];
          
function onload() {
/*
  setInterval(function(){
//    document.getElementById("forecast_embed").src = document.getElementById("forecast_embed").src + "?time=" + new Date();
    document.getElementById("forecast_embed").src = "http://forecast.io/embed/#lat=52.182267&lon=4.429516&name=Valkenburg (ZH)&color=#00aaff&font=Georgia&units=si" + "?time=" + new Date();
//    document.getElementById("forecast_embed").src+="";
//    document.getElementById('forecast_embed').reload(true);   
  }, 5000);
*/
  
//  var tempn = 0;
  
//  setInterval(function(){
//    tempn += 1;
//    document.getElementById("row_t").cells[3].innerHTML = tempn;
//  },2500);

  
  chart_t = new CanvasJS.Chart("chartContainer_t", {
                  zoomEnabled: true,  
                  zoomType: "x",
//                  axisX:{ labelFontSize: 12, },
                  axisY:{ labelFontSize: 12, },
//                  title : { text : "Dynamic Data" },
                  data : [{
                          type : "spline",
                          toolTipContent: "{x}: {y} &deg;C",
                          dataPoints : dataPoints_t
                  }]
              });
  chart_t.render();
  $('#tCollapse').collapse('hide');

  chart_e = new CanvasJS.Chart("chartContainer_e", {
                  zoomEnabled: true,  
                  zoomType: "x",
                  data : [{
                          type : "line",
                          toolTipContent: "{x}: {y} kW/h",
                          dataPoints : dataPoints_e
                  }]
              });
  chart_e.render();
  $('#eCollapse').collapse('hide');
  
  chart_w = new CanvasJS.Chart("chartContainer_w", {
                  zoomEnabled: true,  
                  zoomType: "x",				  
                  data : [{
                          type : "splineArea",
						  color: "rgba(54,158,173,.7)",
                          toolTipContent: "{x}: {y} Litres",
                          dataPoints : dataPoints_w
                  }]
              });
  chart_w.render();   
  $('#wCollapse').collapse('hide');
  
  chart_g = new CanvasJS.Chart("chartContainer_g", {
                  zoomEnabled: true,  
                  zoomType: "x",
                  //height: $('#chartContainer_g').height(),
                  //width: $('#operational').width(),
                  data : [{
                          type : "stepLine",
						  connectNullData: true,
                          toolTipContent: "{x}: {y} m&sup3",
                          dataPoints : dataPoints_g
                  }]
              });
  chart_g.render();         
  $('#gCollapse').collapse('hide');
// http://www.tutorialspoint.com/bootstrap/bootstrap_collapse_plugin.htm

  var str_today = get_time_str(new Date());   
  document.getElementById("row_t").cells[3].innerHTML = str_today;
  document.getElementById("row_e").cells[3].innerHTML = str_today;
  document.getElementById("row_w").cells[3].innerHTML = str_today;
  document.getElementById("row_g").cells[3].innerHTML = str_today;
  
  connect();
}    

//function f(arg) { document.getElementById("row_t").cells[3].innerHTML = arg }
   
var tmr_water;
   
function updateKnown(message, msg_time) {
    var msg_value = parseFloat(message.payloadString);
    var str_msg_time = get_time_str(msg_time);
//    var bold_str_msg_time = "<b>" + str_msg_time + "</b>";

    msg_time.setSeconds(msg_time.getSeconds());   
    
    var icon_off = "&nbsp;&nbsp;<img src=\"img/off-line4.png\" height=\"16\"/>&nbsp;&nbsp;&nbsp";
    var icon_on = "&nbsp;&nbsp;<img src=\"img/on-line4.png\" height=\"16\"/>&nbsp;&nbsp;&nbsp;";
    
    switch (message.destinationName)
    {
      case "power_meter/temperature":
	    var new_value = +msg_value.toFixed(2);
        document.getElementById("row_t").cells[1].innerHTML = "<font color=\"gray\">" + new_value + "</font>";
        setTimeout(function() { document.getElementById("row_t").cells[1].innerHTML = new_value }, 400);
        document.getElementById("row_t").cells[3].innerHTML = str_msg_time;
//        setTimeout(function() { document.getElementById("row_t").cells[3].innerHTML = str_msg_time }, 200);
        dataPoints_t.push({ x : msg_time, y : msg_value });
        chart_t.render();
        break;
        
      case "power_meter/electricity":
        var new_value = 3.6 / msg_value;
        new_value = +new_value.toFixed(3);
        document.getElementById("row_e").cells[1].innerHTML = "<font color=\"gray\">" + new_value + "</font>";
        setTimeout(function() { document.getElementById("row_e").cells[1].innerHTML = new_value }, 400);
        document.getElementById("row_e").cells[3].innerHTML = str_msg_time;
//        setTimeout(function() { document.getElementById("row_e").cells[3].innerHTML = str_msg_time }, 200);
        dataPoints_e.push({ x : msg_time, y : new_value });
        chart_e.render();
        break;
        
      case "power_meter/water":
	    clearTimeout(tmr_water);
        var new_value = parseInt(document.getElementById("row_w").cells[1].innerHTML) + msg_value;
        document.getElementById("row_w").cells[1].innerHTML = "<font color=\"gray\">" + new_value + "</font>";
        setTimeout(function() { document.getElementById("row_w").cells[1].innerHTML = new_value }, 400);
        document.getElementById("row_w").cells[3].innerHTML = str_msg_time;
//        setTimeout(function() { document.getElementById("row_w").cells[3].innerHTML = str_msg_time }, 200);
        dataPoints_w.push({ x : msg_time, y : new_value });
        chart_w.render();
		tmr_water = setTimeout(function() { dataPoints_w.push({ x : msg_time, y : null }) }, 10000);
        break;
        
      case "power_meter/gas":
        var new_value = parseFloat(document.getElementById("row_g").cells[1].innerHTML) + 0.01; // TODO: parseFloat(message.payloadString);
        new_value = +new_value.toFixed(2);
        document.getElementById("row_g").cells[1].innerHTML = "<font color=\"gray\">" + new_value + "</font>";
        setTimeout(function() { document.getElementById("row_g").cells[1].innerHTML = new_value }, 400);
        document.getElementById("row_g").cells[3].innerHTML = str_msg_time;
//        setTimeout(function() { document.getElementById("row_g").cells[3].innerHTML = str_msg_time }, 200);
        dataPoints_g.push({ x : msg_time, y : new_value });
        chart_g.render();
        break;
        
      case "power_meter/ID93305":
        if(message.payloadString == "online") {
          //document.getElementById("tbl_cap").innerHTML = icon_on + message.destinationName;
          document.getElementById("heading_op").innerHTML = icon_on + message.destinationName;
        } 
        else if(message.payloadString == "offline") {
          //document.getElementById("tbl_cap").innerHTML = icon_off + message.destinationName;
          document.getElementById("heading_op").innerHTML = icon_off + message.destinationName;
        }      
        break;
        
      default: 
        return false;
    }
    return true;
}