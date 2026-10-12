/* Matter Debug Mode draft 1. AskiaScript-generated data lives in default.html. */
(function () {
  'use strict';
  var panel = document.getElementById('matter-debug-panel');
  if (!panel) return;
  var toggle = document.getElementById('matter-debug-toggle');
  var content = document.getElementById('matter-debug-content');
  var button = document.getElementById('matter-debug-answer');
  var status = document.getElementById('matter-debug-status');
  var changed = [];

  function openPanel(open) {
    panel.classList.toggle('is-open', open);
    content.hidden = !open;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  toggle.addEventListener('click', function () {
    openPanel(toggle.getAttribute('aria-expanded') !== 'true');
  });
  document.addEventListener('keydown', function (event) {
    if (event.keyCode === 27 && toggle.getAttribute('aria-expanded') === 'true') {
      openPanel(false);
      toggle.focus();
    }
  });

  function controls(name) {
    return Array.prototype.slice.call(document.getElementsByName(name));
  }
  function remember(el) {
    if (changed.indexOf(el) < 0) changed.push(el);
  }
  function write(name, value) {
    var els = controls(name);
    if (!els.length) return false;
    for (var i = 0; i < els.length; i++) {
      els[i].value = value;
      // Browser date/number controls reject invalid formats by clearing the value.
      if (value !== '' && els[i].value === '') return false;
      remember(els[i]);
    }
    return true;
  }
  function single(code, value) {
    var els = controls('U' + code).concat(controls('B' + code));
    var found = false;
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.type === 'radio') {
        el.checked = el.value === value;
        if (el.checked) found = true;
        remember(el);
      } else {
        el.value = value;
        if (el.value === value) found = true;
        remember(el);
      }
    }
    return found;
  }
  function multiple(code, value) {
    var values = value ? value.split(',') : [];
    var els = document.querySelectorAll('input,select');
    var found = {};
    var listFound = false;
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.name === 'L' + code) {
        if (el.nodeName === 'SELECT') {
          for (var j = 0; j < el.options.length; j++) {
            el.options[j].selected = values.indexOf(el.options[j].value) >= 0;
            if (el.options[j].selected) found[el.options[j].value] = true;
          }
        } else {
          el.value = value;
          listFound = true;
        }
        remember(el);
      } else {
        var prefixes = ['M' + code + ' ', 'chkM' + code + ' ', 'R' + code + ' '];
        for (var k = 0; k < prefixes.length; k++) {
          if (el.name.indexOf(prefixes[k]) !== 0) continue;
          var response = el.name.substring(prefixes[k].length);
          var rank = values.indexOf(response);
          if (el.type === 'checkbox') el.checked = rank >= 0;
          else el.value = rank >= 0 ? String(rank + 1) : '';
          if (rank >= 0) found[response] = true;
          remember(el);
          break;
        }
      }
    }
    if (listFound) return true;
    if (!values.length) return false;
    return values.every(function (response) { return !!found[response]; });
  }
  function fill(row) {
    var type = row.getAttribute('data-type');
    var code = row.getAttribute('data-inputcode');
    var value = row.getAttribute('data-values');
    if (type === 'chapter') return true;
    if (type === 'numeric') return value !== '' && write('C' + code, value);
    if (type === 'open') return write('S' + code, value);
    if (type === 'date') return write('D' + code, value);
    if (type === 'time') return write('T' + code, value);
    if (type === 'datetime') {
      var parts = value.split(',');
      return parts.length === 2 && write('D' + code, parts[0]) && write('T' + code, parts[1]);
    }
    if (type === 'single') return value !== '' && single(code, value);
    if (type === 'multiple') return multiple(code, value);
    return false;
  }
  function notify(el, type) {
    var event = document.createEvent('HTMLEvents');
    event.initEvent(type, true, false);
    el.dispatchEvent(event);
  }
  button.addEventListener('click', function () {
    if (button.disabled) return;
    button.disabled = true;
    changed = [];
    var errors = [];
    var rows = document.querySelectorAll('#matter-debug-data [data-inputcode]');
    try {
      for (var i = 0; i < rows.length; i++) {
        if (!fill(rows[i])) errors.push(rows[i].getAttribute('data-shortcut'));
      }
      for (var j = 0; j < changed.length; j++) {
        notify(changed[j], 'input');
        notify(changed[j], 'change');
      }
      if (errors.length) {
        status.textContent = 'Could not fill: ' + errors.join(', ') + '. Check these controls manually; Next was not clicked.';
        button.disabled = false;
        return;
      }
      status.textContent = 'Answers filled. Clicking Next in one second...';
      window.setTimeout(function () {
        var next = document.querySelector('input[name="Next"], button[name="Next"]');
        button.disabled = false;
        if (!next || next.disabled) {
          status.textContent = 'Answers filled, but Next is unavailable.';
          return;
        }
        status.textContent = 'Next clicked. Check any validation messages on the page.';
        next.click();
      }, 1000);
    } catch (error) {
      status.textContent = 'Auto Answer stopped: ' + error.message;
      button.disabled = false;
    }
  });
}());
