import moment from 'moment';
import uiModules from 'ui/modules';
import uiRoutes from 'ui/routes';

import 'ui/autoload/styles';
import './less/main.less';
import template from './templates/index.html';

uiRoutes.enable();
uiRoutes
  .when('/', {
    template,
    resolve: {
      currentTime($http) {
        return $http.get('../api/devices/example').then(function (resp) {
          return resp.data.time;
        });
      }
    }
  });

uiModules
  .get('app/devices', [])
  .controller('devicesHelloWorld', function ($scope, $route, $interval, $http) {
    $scope.title = 'Devices';
    $scope.description = 'An awesome Kibana plugin';

    const currentTime = moment($route.current.locals.currentTime);
    $scope.currentTime = currentTime.format('HH:mm:ss');
    const unsubscribe = $interval(function () {
      $scope.currentTime = currentTime.add(1, 'second').format('HH:mm:ss');
    }, 1000);
    $scope.$watch('$destroy', unsubscribe);

    const kapuaUrl = 'http://10.18.1.4:18081';
    $scope.deviceLimit = 20;
    $scope.deviceOffset = 1;


    function getToken() {
      const req = {
        method: 'POST',
        url: kapuaUrl + '/v1/authentication/user',
        kbnXsrfToken: false,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        data: {
          'password': 'kapua-password',
          'username': 'kapua-sys'
        }
      };
      $http(req).then(
        function successCallback(response) {
          $scope.token = response.data.tokenId;
          deviceCount();
          getDevices();
        },
        function errorCallback() {
          alert('Kapua鉴权请求失败');
        });
    }

    function getDevices() {
      const offset = $scope.deviceOffset - 1;
      const req = {
        method: 'GET',
        url: kapuaUrl + '/v1/AQ/devices?offset=' + offset + '&limit=' + $scope.deviceLimit,
        kbnXsrfToken: false,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': $scope.token
        }
      };
      $http(req).then(
        function successCallback(response) {
          $scope.devices = response.data.items;
          addEvent();
        },
        function errorCallback() {
          alert('设备列表请求失败');
        });
    }

    // function deviceConnections(devices) {
    //   const req = {
    //     method: 'GET',
    //     url: kapuaUrl + '/v1/AQ/deviceConnections?limit=20&offset=0',
    //     kbnXsrfToken: false,
    //     headers: {
    //       'Accept': 'application/json',
    //       'Authorization': $scope.token
    //     },
    //     data: devices
    //   };
    //   $http(req).then(
    //     function successCallback(response) {
    //     },
    //     function errorCallback() {
    //       alert('设备连接信息请求失败');
    //     });
    // }

    function deviceCount() {
      const req = {
        method: 'POST',
        url: kapuaUrl + '/v1/AQ/devices/_count',
        kbnXsrfToken: false,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': $scope.token
        },
        data: {
          'scopeId': 'AQ',
          'limit': 0,
          'offset': 99999
        }
      };
      $http(req).then(
        function successCallback(response) {
          $scope.deviceCount = response.data.count;
        },
        function errorCallback() {
          alert('设备总数请求失败');
        });
    }


    function nextPage() {
      clearEvent();
      if ($scope.deviceOffset + $scope.devices.length <= $scope.deviceCount) {//没有更多数据
        $scope.deviceOffset += $scope.deviceLimit;
        getDevices();
      }
    }

    function privPage() {
      clearEvent();
      if ($scope.deviceOffset > $scope.deviceLimit) {
        $scope.deviceOffset -= $scope.deviceLimit;
      } else if ($scope.deviceOffset !== 1) {
        $scope.deviceOffset = 1;
      } else {
        addEvent();
        return;
      }
      getDevices();
    }

    getToken();

    function addEvent() {
      if ($scope.nextPage == null) {
        $scope.nextPage = nextPage;
      }
      if ($scope.privPage == null) {
        $scope.privPage = privPage;
      }
    }

    function clearEvent() {
      $scope.privPage = null;
      $scope.nextPage = null;
    }

  });

