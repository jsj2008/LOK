// Generated by CoffeeScript 1.10.0
(function() {
  window.Application = {
    init: function() {
      this.setup_socket();
      this.setup_chart();
      this.event_bind();
      return Vue.filter('filter_request', function(list, filter) {
        var i, j, l, len;
        if (filter !== 'all') {
          l = [];
          for (j = 0, len = list.length; j < len; j++) {
            i = list[j];
            if (i.responseMIMEType.match(filter)) {
              l.push(i);
            }
          }
          return l;
        } else {
          return list;
        }
      });
    },
    requests_list: new Vue({
      el: '#requests_list',
      data: {
        list: [],
        filter_type: "all"
      },
      methods: {
        params_list_html: function(request) {
          var className, html_string, index, j, k, len, len1, param, params, params_list, path, path_list, url;
          url = new URL(request.requestURLString);
          path_list = url.pathname.split('/');
          params_list = url.search.substr(1, url.search.length).split('&');
          html_string = "";
          for (index = j = 0, len = path_list.length; j < len; index = ++j) {
            path = path_list[index];
            if (!path.length) {
              continue;
            }
            className = 'info';
            if (path[path.length - 1] === "s") {
              className = 'primary';
            }
            html_string += "<label class='label label-" + className + "'>" + path + "</label>";
          }
          if (params_list.length > 1) {
            html_string += "<label class='label label-warning'>?</label>";
          }
          for (index = k = 0, len1 = params_list.length; k < len1; index = ++k) {
            param = params_list[index];
            params = param.split('=');
            html_string += "<label class='label label-success'  data-toggle='tooltip' data-placement='bottom' title='" + params[1] + "'>" + params[0] + "</label>";
          }
          return html_string;
        },
        date_format: function(request) {
          return moment.unix(+request.datetime).format("h:mm:ss a");
        },
        show_content: function(request) {
          var data, e, error, image, jsonObject;
          $('.request-result').hide();
          window.fuck = request;
          switch (request.responseMIMEType) {
            case 'application/json':
              $('#request-result-block').animate({
                right: 0
              }, 300).find('.title').html("<label class='label label-info'>" + request.requestHTTPMethod + "</label> - " + request.requestURLString);
              try {
                jsonObject = jQuery.parseJSON(request.JSONString);
              } catch (error) {
                e = error;
                $('#JSON-body').html(request.JSONString);
                return;
              }
              data = JSON.parse(request.JSONString);
              $.hulk('#JSON-body', data, function(data) {
                console.log(data);
              });
              break;
            case 'image/jpeg':
              image = $('<img>');
              image.attr('src', request.requestURLString);
              return $('#request-result-modal').modal('show').find('.modal-title').html("<a href='" + request.requestURLString + "' target='blank'>" + (request.requestURLString.slice(0, 40) + "...") + "</a>").end().find('.request-result-body').hide().end().find('.image-body').show().html(image);
          }
        }
      }
    }),
    base_info: new Vue({
      el: '#base_info',
      data: {
        count: 0,
        path: "",
        app_name: "",
        memory_size: 0,
        start_time: null,
        cpu_percent: 0,
        memory_percent: 0,
        fps: 0
      }
    }),
    UTCDateString: function(date) {
      var dates, hours, mins, month, sec, year;
      year = date.getUTCFullYear();
      month = this.pad(date.getUTCMonth() + 1);
      dates = this.pad(date.getUTCDate());
      hours = this.pad(date.getUTCHours());
      mins = this.pad(date.getUTCMinutes());
      sec = this.pad(date.getUTCSeconds());
      return year + "-" + month + "-" + dates + "T" + hours + ":" + mins + ":" + sec + "Z";
    },
    pad: function(number) {
      if (number < 10) {
        return '0' + number;
      }
      return number;
    },
    setup_socket: function() {
      var _this;
      _this = this;
      this.socket = new WebSocket("ws://" + location.hostname + ":" + (+location.port + 1));
      this.socket.onopen = function() {
        return _this.socket.send('hello world and what is your name?');
      };
      this.socket.onmessage = function(event) {
        var data;
        data = JSON.parse(event.data);
        switch (data.type) {
          case "request":
            _this.handle_request(data.data);
            break;
          case "usage":
            _this.handle_usage(data.data);
            break;
          case "base_info":
            _this.base_info.app_name = data.name;
            _this.base_info.memory_size = data.memory_size;
            _this.base_info.start_time = data.start_time;
            setTimeout(function() {
              return $("#start_time").text(moment.unix(+data.start_time).fromNow());
            }, 100);
            setInterval(function() {
              return $("#start_time").text(moment.unix(+data.start_time).fromNow());
            }, 60000);
            break;
        }
      };
      return this.socket.onclose = function() {
        console.log('Lost connection! Maybe server is close.');
        return setTimeout(function() {
          return _this.setup_socket();
        }, 100);
      };
    },
    handle_request: function(data) {
      return this.requests_list.list.unshift(data);
    },
    handle_usage: function(data) {
      this.base_info.cpu_percent = data.cpu_usage.toFixed(2);
      this.base_info.memory_percent = (data.memory_usage / (1024 * 1024 * 10)).toFixed(2);
      this.base_info.fps = data.fps;
      this.base_info.count = data.thread_count;
      this.base_info.path = data.viewcontroller_path;
      if (this.memory_chart.getContext) {
        this.setup_chart();
        return;
      }
      this.cpu_data.datasets[0].data.push(data.cpu_usage);
      this.cpu_chart.addData([data.cpu_usage], '');
      if (this.cpu_chart.datasets[0].points.length > this.chart_max_count) {
        this.cpu_chart.removeData();
      }
      this.memory_data.datasets[0].data.push(data.memory_usage);
      this.memory_chart.addData([data.memory_usage >> 20], '');
      if (this.memory_chart.datasets[0].points.length > this.chart_max_count) {
        this.memory_chart.removeData();
      }
      this.memory_chart.update();
      this.fps_data.datasets[0].data.push(data.fps);
      this.fps_chart.addData([data.fps], '');
      if (this.fps_chart.datasets[0].points.length > this.chart_max_count) {
        this.fps_chart.removeData();
      }
      return this.fps_chart.update();
    },
    setup_chart: function() {
      var cpu_ctx, fps_ctx, memory_ctx, option;
      $.each($('canvas'), function() {
        var el;
        el = $(this);
        return el.attr({
          "width": el.parent().width(),
          "height": 200
        });
      });
      option = {
        pointDot: false,
        showTooltips: false
      };
      cpu_ctx = $("#cpu_chart").get(0).getContext("2d");
      this.cpu_chart = new Chart(cpu_ctx).Line(this.cpu_data, {
        scaleLabel: "<%=value%>%",
        pointDot: false,
        showTooltips: false
      });
      memory_ctx = $("#memory_chart").get(0).getContext("2d");
      this.memory_chart = new Chart(memory_ctx).Line(this.memory_data, {
        scaleLabel: "<%=value%>MB",
        pointDot: false,
        animation: false,
        showTooltips: false
      });
      fps_ctx = $("#fps_chart").get(0).getContext("2d");
      return this.fps_chart = new Chart(fps_ctx).Line(this.fps_data, option);
    },
    event_bind: function() {
      var _this;
      _this = this;
      $('body').tooltip({
        selector: '[data-toggle="tooltip"]'
      });
      $('#request_filter li a').on("click", function() {
        return _this.requests_list.filter_type = $(this).text();
      });
      $('#request-result-block .close').click(function() {
        return $('#request-result-block').animate({
          right: -$(window).width()
        }, 300);
      });
      $('.result-block-bottom .btn').click(function() {
        var data;
        data = $.hulkSmash('#JSON-body');
        _this.socket.send(JSON.stringify(data));
        return $('#request-result-block').animate({
          right: -$(window).width()
        }, 300);
      });
      $('.nav-tabs a').click(function(e) {
        e.preventDefault();
        return $(this).tab('show');
      });
      return $(window).bind('beforeunload', function(e) {
        var message;
        message = false;
        if (true) {
          message = "Are you sure to leave? make sure you backup the test data.";
          e.returnValue = message;
        } else {
          return;
        }
        return message;
      });
    },
    data_store: function() {},
    chart_max_count: 150,
    cpu_data: {
      labels: [],
      datasets: [
        {
          fillColor: "rgba(151,187,205,0.7)",
          strokeColor: "rgba(151,187,205,1)",
          data: []
        }
      ]
    },
    memory_data: {
      labels: [],
      datasets: [
        {
          fillColor: "rgba(216,165,159,0.7)",
          strokeColor: "rgba(216,165,159,1)",
          data: []
        }
      ]
    },
    fps_data: {
      labels: [],
      datasets: [
        {
          fillColor: "rgba(216,204,134,0.7)",
          strokeColor: "rgba(216,204,134,1)",
          data: []
        }
      ]
    }
  };

  $(function() {
    return Application.init();
  });

}).call(this);
