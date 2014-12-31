var HeadroomComponents = angular.module('HeadroomComponents', ['headroom']);

HeadroomComponents.directive('headroomSpacer', function() {
  return {
    restrict: 'A',
    scope: {
      headroomParent: '@headroomSpacer'
    },
    controller: ['$scope', '$element',
      function($scope, $element) {
        $element.height($('#' + $scope.headroomParent).height());
      }
    ]
  };
});
