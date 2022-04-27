
//=====================================//
//End call feedback display
//=====================================//

//=====================================//
//Interupt Notification
//=====================================//

//=====================================//
//Quiet Notification
//=====================================//




//creates an element (why has he dollar signed this??)
function $el(tag,props) {
  let p,el = document.createElement(tag);
  if (props) {
    for (p in props) {
      el[p] = props[p];
    }
  }
  return el;
}


// Default config
// These values may be overridden by values retrieved from server
let config = {
  participants_selector: 'div[role="list"][aria-label="Participants"]',
  pulse_timeslice: 500,
  min_talk_time_to_show: 2000
};
let options = {};
let data = {};
let participants_list = null;
let totaltalktime = 0;
let currentlyTalking = [];
let interruptionDetected = false;
let countInterruptions = 0;

let groups = {
  "a":{ "participants":{} },
  "b":{ "participants":{} },
  "c":{ "participants":{} },
  "d":{ "participants":{} }
};
let update_display_required = false;

let dom_container_notif = null;
let dom_container = null;
let dom_table = null;
let dom_total = null;
let interrupt_total = null;



// ==================================================================
// UTIL
// ==================================================================

// UTIL: DOM
// ---------
function parent(el,selector) {
  //console.log("parent",el);
  if (el.matches && el.matches(selector)) { return el; }
  if (el.parentNode) { return parent(el.parentNode,selector); }
  return null;
}

// UTIL: TIME FORMATTING
// ---------------------
function formatTime(t) {
  try {
    if (!t) {
      return "";
    }
    let m = Math.floor(t / 60);
    let s = Math.floor(t - (m * 60));
    return m + " : " + (("" + s).replace(/^(\d)$/, "0$1"));
  } catch(e) {
    console.log(e);
    return "";
  }
}
function getFormattedTotalTime(record) {
  if (!record || !record.total) { return ""; }
  return formatTime(record.total/1000);
}
function getFormattedTotalPercent(record) {
  if (!record || !record.total || !totaltalktime) { return ""; }
  let pctstr = "";
  if (record.total && totaltalktime) {
    let pct = (record.total / totaltalktime) * 100;
    if (pct>100) { pct=100; } // somehow?
    pctstr = pct.toFixed(0) + "%";
  }
  return pctstr;
}

// ==================================================================
// DOM CREATION
// ==================================================================

// The container for the UI
function createContainer() {
  dom_container = $el('div',{id:"convay-container"});
  dom_container.innerHTML = `
    <div class="convay-top" title="Click to collapse/expand">
      <div class="convay-title">CONVAY</div>
    </div>

    <div class="container-feedback">
        <button class="show-feedback">View Live Feedback</button>
        <button class="hide-feedback">Hide</button>

    <div class="feedback-container" title="viewing feedback">
      <div class="convay-body">
        <div id="feedback-head">Live Feedback</div>
        <div class="convay-summary">Total Spoken Time: <span id="convay-summary-total"></span></div>
        <div class="convay-interruption-summary">Total Interruptions: <span id="interrupt-summary"></div>
        <div class="table-head">Active Members</div>
        <table class="convay-table"><tbody></tbody></table>
        ${createGroupTable()}
        
        <!--<div class="topic-timer">
          <div class="topics-header">Topics Timer</div>
          <div class="topics-body">
            <button id="topic-start">Start Topic</button>
            <div>Topic ends in<span id="countdown"></span></div>
          </div>
        </div> -->

        </div>
        
        </div>

        
        <!--<div class="personal-div">
        <button class="show-personal">Show Personal Feedback</button>
        <button class="hide-personal">Hide Personal Feedback</button>
        <div class="personal">All of my feedback</div>
      </div> -->


      <!--<div class="reactions-div">
        <div class="show-reactions">Show Reactions</div>
        <div class="hide-reactions">Hide Reactions</div>
        <div class="reactions">${createReactions()}</div>
      </div> -->

    </div>

    </div>

    <div class="convay-bottom"></div>
  `;
  document.body.appendChild(dom_container);
  interrupt_total = dom_container.querySelector('#interrupt-summary')
  dom_table = dom_container.querySelector('table');
  dom_total = dom_container.querySelector('#convay-summary-total');
  let onclick=function(selector,f) {
    dom_container.querySelector(selector).addEventListener('click',f);
  };
  onclick('.convay-top',()=>{ dom_container.classList.toggle("collapsed"); });

  onclick('.show-feedback', ()=>{ dom_container.classList.add("show_feedback"); });
  onclick('.hide-feedback', ()=>{ dom_container.classList.remove("show_feedback"); });

  onclick('.show-reactions',()=>{ dom_container.classList.add('show_reactions'); });
  onclick('.hide-reactions',()=>{ dom_container.classList.remove('show_reactions'); });
}

//==========
// Interruption Popup
//==========

// The container for the UI
 function createInterruptNotification() {
  dom_container_notif = $el('div',{id:"notification-container"});
  dom_container_notif.classList.add("hide");
  dom_container_notif.innerHTML = `
  <div class="inner-interrupt" id="interrupt-div">Oops, there was an interruption!</div>
  `;
  document.body.appendChild(dom_container_notif);
}

//==========
// Timer
//==========

var el = document.getElementById('topic-start');
if(el){
  el.addEventListener("click", function(){
  var timeleft = 15;

  var downloadTimer = setInterval(function function1(){
  document.getElementById("countdown").innerHTML = timeleft + 
  "&nbsp"+"seconds remaining";

  timeleft -= 1;
  if(timeleft <= 0){
      clearInterval(downloadTimer);
      document.getElementById("countdown").innerHTML = "Time is up!"
  }
  }, 1000);

  console.log(countdown);
});
}


// Create the group rendering table
function createGroupTable() {
  let table = `<table id="convay-group-table" class="convay-table convay-group-table"><tbody>`;
  ['a','b','c','d'].forEach(group=>{
    table += `
    <tr id="convay-group-row-${group}" class="convay-group-row">
      <td><div contenteditable="true" title="Click to edit label" class="convay-group-label convay-group-selector-${group}">${group.toUpperCase()}</div></td>
      <td id="convay-group-total-${group}" class="convay-group-total convay-time"></td>
      <td id="convay-group-pct-${group}" class="convay-group-pct convay-pct"></td>
      <td>Avg/person: </td>
      <td id="convay-group-avg-${group}" class="convay-group-avg convay-avg"></td>
    </tr>`;
  });
  table += `</tbody></table>`;
  return table;
}

// check if participant already exists (so we can check for presenting duplicates)
function checkForDuplicates ( participant ) {
  let duplicatesFound = 0;
  for ( id in data ) {
    let record = data[ id ];
    if ( record.name === participant.name ) {
      duplicatesFound++;
      if ( duplicatesFound > 1 ) {  
        record.presenting = true;
      }
    }
  }
}

// A participant's row
function createParticipantRow(record) {
  if (!record) { return; }
  let row = $el('tr');
  row.innerHTML = `
    <td class="convay-name">${record.name}</td>
    <td class="convay-time">0:00</td>
    <td class="convay-pct">0%</td>
    <td class="convay-groups">${createParticipantRowGroups(record)}</td>
  `;
  record.row = row;
  record.time_display = row.querySelector('.convay-time');
  record.pct_display = row.querySelector('.convay-pct');
  // Attach click listeners to the groups
  row.querySelectorAll('.convay-group-selector-container > *').forEach(el=>{
    el.addEventListener('click',()=>{
      let group = el.dataset.group;
      let selected = !el.classList.contains('selected');
      el.classList.toggle('selected',selected);
      groups[group].participants[record.id]=selected;
      // Force an immediate re-rendering of groups summary because data may have changed
      updateGroupTotals();
    })
  });
  return row;
}


// Create the group selectors that go into each participant's row
function createParticipantRowGroups() {
  return `
    <div class="convay-group-selector-container" title="Click groups to add this participant's time to a group bucket">
      <div class="convay-group-selector convay-group-selector-a" data-group="a">A</div>
      <div class="convay-group-selector convay-group-selector-b" data-group="b">B</div>
      <div class="convay-group-selector convay-group-selector-c" data-group="c">C</div>
      <div class="convay-group-selector convay-group-selector-d" data-group="d">D</div>
    </div>
    `;
}

// Create the reaction selectors
function createReactions() {
  return `
  <div class="reactions-list-container" title="Click reaction to react">
    <div class="reactions-list reactions-list-happy" data-group="happy">😄</div>
    <div class="reactions-list reactions-list-sad" data-group="sad">😔</div>
    <div class="reactions-list reactions-list-love" data-group="love">😍</div>
    <div class="reactions-list reactions-list-love" data-group="disagree">👎</div>
    <div class="reactions-list reactions-list-agree" data-group="agree">👍</div>
  </div>
  `;
}


// create feedback container function
function createFeedback() {
  return `
  meth
  `
}



// ==================================================================
// DATA PROCESSING
// ==================================================================

// Init a participant the first time we hear from them
// ---------------------------------------------------
function init_participant(id) {
  let record = {
    "id": id,
    "total": 0,
    "last_start": 0,
    "last": 0,
    "name": "",
    "time_display": null,
    "pct_display": null,
    "update_required": false,
    "groups": {},
    "interruptions": 0,
    "visible": false
  };
  getParticipantName(record);
  return record;
}


// Retrieve a participant's name from the DOM
// ------------------------------------------
function getParticipantName(record) {
  if (!record || !record.id || record.name) { return; }
  const listitem = document.querySelector(`div[role="listitem"][data-participant-id="${record.id}"]`);
  if (listitem) {
    // The first span in the container has the name
    const spans = listitem.querySelectorAll('span');
    if (spans && spans.length) {
      record.name = spans[0].innerHTML;
    }
  }
}

// Recognise two users are talking at once
/* if talking true
  another talking true
  mark inturrupt */



// ==================================================================
// DOM UPDATES
// ==================================================================
function talking(record) {
  record.talking=true;
  if (record && record.row && record.row.classList) {
    record.row.classList.add("talking");
  }
}
function notTalking(record) {
  record.talking=false;
  if (record && record.row && record.row.classList) {
    record.row.classList.remove("talking");
  }
}
function updateParticipant(record) {
  if (!record) { return; }
  checkForDuplicates(record);
  if (!record.row) {
    record.row = createParticipantRow(record);
    dom_table.appendChild(record.row);
  }
  if (record && record.update_required && record.total>=config.min_talk_time_to_show) {
    record.time_display.textContent = getFormattedTotalTime(record);
  }
  record.pct_display.textContent = getFormattedTotalPercent(record);
  //let userRow = document.getElementById( record.id );
  //userRow.style.width = getFormattedTotalPercent( record );
  //hide row if there is no speech detected (for duplicated users)
  //if ( record.total === 0 ) {
  //  userRow.classList.add( 'hidden' );
  //}
  record.update_required = false;
}
function updateGroupTotals() {
  let group,p, any_active = false;
  for (group in groups) {
    let record = groups[group];
    let active = false;
    record.total = 0;
    record.count = 0;
    for (p in record.participants) {
      if (!record.participants.hasOwnProperty(p)) { continue; }
      if (record.participants[p]) {
        // User is in group
        active = true;
        record.total += data[p].total;
        record.count++;
      }
    }
    if (active) {
      any_active = true;
      document.querySelector(`#convay-group-total-${group}`).textContent = getFormattedTotalTime(record);
      document.querySelector(`#convay-group-pct-${group}`).textContent = getFormattedTotalPercent(record);
      document.querySelector(`#convay-group-avg-${group}`).textContent = formatTime(record.total/1000/record.count);
    }
    document.querySelector(`#convay-group-row-${group}`).style.display = active ? "table-row" : "none";
  }
  document.querySelector('#convay-group-table').style.display = any_active ? "block" : "none";
}

// Update the display on a regular interval
function render(force) {
  try {
    if (!force && !update_display_required) {
      return;
    }
    dom_total.textContent = formatTime(totaltalktime/1000);
    let id;
    for (id in data) {
      if (!data.hasOwnProperty(id)) { continue; }
      let record = data[id];
      updateParticipant(record);
    }
    // Put them in talk order
    let ids = Object.keys(data);
    ids.sort(function(a,b) {
      if (data[a].total < data[b].total) { return 1; }
      if (data[a].total > data[b].total) { return -1; }
      return 0;
    });
    let needs_reordering = false;
    ids.forEach((id,i)=>{
      let record = data[id];
      if (needs_reordering || !record.order || record.order!==i) {
        needs_reordering = true;
        if (record.row && record.row.parentNode) {
          record.row.parentNode.appendChild(record.row);
        }
        record.order = i;
      }
    });
    // Update the groups
    updateGroupTotals();

    chrome.storage.local.set( { "convay_data": data } );
    update_display_required = false;
  } catch(e) {
    console.log(e);
  }
}
setInterval(render,1000);

//////Interriptuon Detection Function
function detectInterruption() {
  /**first code example, basic interruption log without allocating who interrupted whom.**/
  // let activeUsers = document.getElementsByClassName("talking");
  // if (activeUsers.length >= 2) {
  //   interruptionDetected = true;
  countInterruptions++;
  updateInterruptions();

  //pop up the notification
  let notificationPop = document.getElementById("notification-container");
  notificationPop.classList.remove("hide");

  setTimeout(function(){
    notificationPop.classList.add("hide");
    //interruptionDetected = false;
  }, 10000);

  //let interruptingUsers = activeUsers.getElementsByClassName("convay-name");
  //console.log("There was an interruption with these users" + interruptingUsers);
  
}

function updateInterruptions() {
  interrupt_total.textContent = countInterruptions;
}

// ==================================================================
// SPEECH PROCESSING AND TIMING
// ==================================================================
// Incremental function to run every X ms to keep track of who is talking
let last_pulse = 0;
function pulse() {
  let id, record, now = Date.now();
  let time_since_last_pulse = now-last_pulse;
  if (!last_pulse) {
    last_pulse=now;
    return;
  }
  last_pulse=now;
  try {
    // We need to loop over every participant who has ever talked
    for (id in data) {
      if (!data.hasOwnProperty(id)) { continue; }
      record = data[id];
      if (record.talking) {
        if (now - record.last > 250) { //set at 250 as 1 second doesn't detect and any faster means an intake of breath could equal several interruptions & pulse is not recording milliseconds correctly, so it rarely goes over 1000.
          if (!currentlyTalking.includes(id)){
            currentlyTalking.push(id);
          }

          if (currentlyTalking.length > 1 && !interruptionDetected) {
            if (data[currentlyTalking[0]].talking == true) {
        
              interruptionDetected = true;
              data[currentlyTalking[1]].interruptions++;

              console.log(JSON.stringify(data[currentlyTalking[0]]) + 'was interrupted by');

              console.log('this person' + JSON.stringify(data[currentlyTalking[1]]));

              detectInterruption();
            }
          }
        }
        record.update_required = true;

          
        // If it's been more than 1s since they have talked, they are done
        if (now - record.last >= 1000) {
          currentlyTalking.pop(id);

          record.talking = false;
          record.last_start = 0;
          // Mark them as not talking
          notTalking(record);
          if (currentlyTalking.length >= 1) {
            interruptionDetected = false;
          }
          continue;
        }
        let duration = (record.last - record.last_start);

        // If the person has been talking but not yet for at least one pulse_timeslice, don't do anything yet
        if (duration < config.pulse_timeslice) {
          continue;
        }

        // Update this person's time and total time with pulse timer duration
        record.total += time_since_last_pulse;
        totaltalktime += time_since_last_pulse;

        // Mark them as talking
        talking(record);

        // Flag the display as requiring an update
        update_display_required = true;
      }
    }
  } catch(e) {
    console.log(e);
  }
}
setInterval(pulse,config.pulse_timeslice);

// ==================================================================
// SPEECH DETECTION
// ==================================================================
// Watch for the talk icon to animate
let observer = new MutationObserver(function(mutations) {
  try {
    // console.log("MUTATION OBSERVER");
    // console.log(mutations);

    mutations.forEach(function(mutation) {
      let el = mutation.target;

      // Only act if there really was a change
      // I don't think I should have to do this, but here we are
      if (mutation.oldValue===el.className) { return; }

      // The element must be visible for it to count. When muted, the talk bars become hidden
      let display = getComputedStyle(el).getPropertyValue('display');
      //console.log(display,el);
      if ("none"===display) {
        return;
      }

      //console.log("Talking detected "+Date.now(), el);

      // Make sure the participant has a data record and it's being tracked
      let id = el.getAttribute('talk-id');
      if (!id) {
        let listitem = parent(el, 'div[role="listitem"]');
        if (listitem) {
          id = listitem.getAttribute('data-participant-id');
          el.setAttribute('talk-id', id);
        }
      }

      // This is the first time this person has talked, add a timer for them
      let record = data[id];
      if (!record) {
        record = data[id] = init_participant(id,el);
      }

      const now = Date.now();
      if (!record.last_start) {
        record.last_start = now;
      }
      if (record.last < now) {
        record.last = now;
      }
      record.talking = true;

    });
  } catch(e) {
    console.log(e);
  }
});

// ==================================================================
// ATTACH
// ==================================================================
let observerConfig = {
  attributes: true,
  attributeOldValue: true,
  attributeFilter: ['class'],
  subtree: true,
};
let attached = false;
function attach() {
  if (attached) {
    if (!participants_list || !participants_list.parentNode) {
      // Participants panel has been turned off
      dom_container.style.display = "none";
      observer.disconnect();
      attached = false;
    }
  }
  else {
    //console.log( config.participants_selector );
    //console.log( document.querySelector(config.participants_selector) );

    participants_list = document.querySelector(config.participants_selector);
    if (participants_list) {
      observer.observe( participants_list, observerConfig );
      if (dom_container) {
        dom_container.style.display="block";
      }
      else {
        createContainer();
      }
      attached = true;
    }
  }
}

// ==================================================================
// WELCOME MESSAGE
// ==================================================================
function welcome() {
  let d = $el('div', {id:"convay-welcome"});
  d.innerHTML = `
    <div class="title">Welcome to Convay!</div>
    <div>To enable the display, turn on the Participants list while in a Meeting.</div>
    <div>Don't forget to say something when you join the meeting to be added to the feedback.

      <button id="welcome-okay">Okay</button>
    </div>
  `;
  document.body.appendChild(d);

  document.querySelector('#welcome-okay').addEventListener('click',()=>{
    options.welcome_dismissed = true;
    chrome.storage.local.set({"options":options});
    d.style.display="none";
  });
}

// ==================================================================
// BOOTSTRAP
// ==================================================================

// Get options
chrome.storage.local.get(['options'],function(storage) {
  options = storage.options;
  if (!options) {
    options = {
      "welcome_dismissed": false
    };
    chrome.storage.local.set({"options":options});
  }
  if (!options.welcome_dismissed) {
    addEventListener('DOMContentLoaded',welcome);
  }


  setInterval(attach,1000);
  createInterruptNotification();
});
