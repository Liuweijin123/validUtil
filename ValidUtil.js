/**
 * 表单验证
 */
var valid = {};
(function (valid, doc) {
	//class validCoreCls{
	function validCoreCls (){
		//constructor() {
			var _guarders = [];
			var _sayers = [];
			var _configs = {};
			this.getGuarder = function (indexOrName) {
				for (var i = 0; i < _guarders.length; i++) {
					if (i == indexOrName || _guarders[i].name == indexOrName) {
						return _guarders[i];
					}
				}
				return this;
			};
			this.attachGuarder = function (guarder) {
				for (var i = 0; i < _guarders.length; i++) {
					if (guarder.index === i) {
						_guarders[0] = guarder;
						return;
					}
				}
				_guarders.push(guarder);
				return this;
			};
			this.getSayer = function (indexOrName) {
				for (var i = 0; i < _sayers.length; i++) {
					if (i == indexOrName || _sayers[i].name == indexOrName) {
						return _sayers[i];
					}
				}
			};
			this.attachSayer = function (sayer) {
				for (var i = 0; i < _sayers.length; i++) {
					if (sayer.index === i) {
						_sayers[0] = sayer;
						return;
					}
				}
				_sayers.push(sayer);
				return this;
			};
			this.result = function () {
				return {
					isTrue: true,
					msg: undefined
				};
			};
			this.getConfig = function (config_name) {
				return _configs[config_name];
			};
			this.config = function (config_obj) {
				_configs = config_obj;
			};
			this.getDeclareDes = function () {
				var str = "";
				for (var i = 0; i < _guarders.length; i++) {
					str += ","+_guarders[i].index;
					str += "-" + _guarders[i].name;
					str += "-" + _guarders[i].des+"\n";
				}
				return str.substring(1);
			}
		//}
	}
	validCore = new validCoreCls();

	function validUtilCls (){
		//constructor() {
			this.getParam = function (sVal, fGet) {
				if (/^\{.*\}$/.test(sVal)) {
					return sVal.replace("{", "").replace("}", "");
				}
				if (fGet) {
					return fGet(sVal);
				}
				return sVal;
			};
			this.checkOne = function (element) {
				var rs = valid.core.result();
				var strEx = element.getAttribute("data-valid");
				var arr = strEx.split(",");
				for (var i = 0; i < arr.length; i++) {
					rs = valid.util.checkInput(element, arr[i]);
					if (!rs.isTrue)
						break;
				}
				return rs;
			};
			this.checkInput = function (element, strEx) {
				var rs = validCore.result();
				var arr = strEx.split("-");
				var vlArr = arr[0].split(".");
				var guarder = valid.core.getGuarder(vlArr[0]);
				if (guarder) {
					guarder = Object.assign({}, guarder);
					if (guarder.check) {
						var ckRs = guarder.check(element, vlArr.slice(1));
						if (!(ckRs instanceof Object))
							rs.isTrue = ckRs;
						else {
							rs.isTrue = ckRs.isTrue;
							rs.msg = ckRs.msg;
						}
					}
				}
				if (!rs.isTrue) {
					var msArr = [0];
					if (arr[1]) {
						msArr = arr[1].split(".");
					}
					var sayer = Object.assign({}, validCore.getSayer(0));
					sayer.source = rs.msg;
					var params = [];
					if (msArr[0]) {
						sayer.source = msArr[0];
						if (validCore.getSayer(msArr[0])) {
							sayer = Object.assign({}, validCore.getSayer(msArr[0]));
						}
						params = msArr.slice(1);
					}
					rs.msg = sayer.say(element, params);
				}
				return rs;
			};
			this.checkInputs = function () {
				var rs = validCore.result();
				var $inputs = $("input[data-valid]");
				for (var i = 0; i < $inputs.length; i++) {
					rs = valid.util.checkOne($inputs[i]);
					if (!rs.isTrue)
						break;
				}
				return rs;
			};
	//	}
	}
	validUtil = new validUtilCls();

	validCore.attachGuarder({
			index: 0,
			name: "required",
			check: function (element, params) {
				if (!element.value)
					return false;
				return true;
			},
			des: "验证非空，格式 (0|request)[-{message}]"
		})
		.attachGuarder({
			index: 1,
			name: "length",
			check: function (element, params) {
				if (params && element.value != undefined) {
					var prr = [];
					if (element.getAttribute("data-property")) {
						var prr = element.getAttribute("data-property").split(",");
					}
					var min = valid.util.getParam(params[0], function (idx) {
						return prr[idx]
					});
					var max = valid.util.getParam(params[1], function (idx) {
						return prr[idx]
					});

					if (min && !(element.value.length >= min))
						return false;
					if (max && !(element.value.length <= max))
						return false;
				}
				return true;
			},
			getDefMsg:function (element, params) {
				
			},
			des: "输入长度验证，格式 (1|length).({$min}.{$max})[-{message}]"
		})
		.attachGuarder({
			index: 2,
			name: "regexp",
			check: function (element, params) {
				if (params && element.value != undefined) {
					var prr = [];
					if (element.getAttribute("data-property"))
						var prr = element.getAttribute("data-property").split(",");
					for (var i = 0; i < params.length; i++) {
						var rgKey = valid.util.getParam(params[i], function (idx) {
							return prr[idx]
						});
						var rg = valid.core.getConfig('regular')[rgKey];
						if (rg) {
							if (!rg.test(element.value)) {
								return false;
							}
						}
					}
				}
				return true;
			},
			des: "正则表达式验证，格式：(2|regexp).{regexpType}[.{regexpType}] "
		})
		.attachGuarder({
			index: 3,
			name: "equalTo",
			check: function (element, params) {
				if (params && element.value != undefined) {
					var prr = [];
					if (element.getAttribute("data-property"))
						var prr = element.getAttribute("data-property").split(",");
					if (params.length > 0) {
						var toVal = valid.util.getParam(params[0], function (idx) {
							return prr[idx]
						});
						if (toVal.indexOf("#") > -1)
							toVal = $(toVal).val();
						if (element.value !== toVal)
							return false;
					}
				}
				return true;
			},
			des: "判断输入值必须和 #field 相同，格式：(3|equalTo).{#field}[-{message}]"
		})
		.attachGuarder({
			index: 4,
			name: "external",
			check: function (element, params) {
				if (params && element.value != undefined) {
					var prr = [];
					if (element.getAttribute("data-property"))
						var prr = element.getAttribute("data-property").split(",");
					if (params.length > 0) {
						var fName = valid.util.getParam(params[0], function (idx) {
							return prr[idx]
						});
						if (doc[fName]) {
							return doc[fName](element, params.slice(1));
						}
					}
				}
				return true;
			},
			des: "调用外部方法进行验证，格式：(4.external).{funcName}[-{message}]"
		});

	validCore.attachSayer({
		source: "",
		index: 0,
		name: "default",
		say: function (element, params) {
			var msg = element.getAttribute("id") + "验证不通过";
			if (!params || params.length == 0) {
				if (this.source)
					msg = valid.util.getParam(this.source);
				else if (element.getAttribute("placeholder"))
					msg = element.getAttribute("placeholder");
			} else {
				var prr = [];
				if (element.getAttribute("data-property")) {
					prr = element.getAttribute("data-property").split(",");
				}
				if (params.length == 1) {
					msg = validUtil.getParam(params[0], function (idx) {
						return prr[idx]
					})
					if (/\{0\}/.test(msg)) {
						var value = validUtil.getParam(this.source, function (idx) {
							return prr[idx]
						})
						msg = msg.replace("{0}", value);
					}
				} else {
					var str = validUtil.getParam(params[0], function (idx) {
						return prr[idx]
					});
					for (var i = 1; i < params.length; i++) {
						var sVal = validUtil.getParam(params[i], function (idx) {
							return prr[idx]
						});
						str = str.replace("{" + (i - 1) + "}", sVal);
					}
					msg = str;
				}
			}
			return msg;
		},
		des: "默认，格式 （0|default）.{$param_formate}[.{$param_i}]"
	});

	validCore.config({
		regular: {
			tel: /^1(3[0-9]|4[57]|5[0-35-9]|8[0-9]|99|7[0-9])\d{8}$/, //手机号码
			phone: /^(0[0-9]{2,3}\-)?([2-9][0-9]{6,7})+(\-[0-9]{1,4})?$/, //电话号码
			telOrPhone: { //手机或电话号码
				test: function (value) {
					if (!/^1(3[0-9]|4[57]|5[0-35-9]|8[0-9]|99|7[0-9])\d{8}$/
						.test(value) &&
						!/^(0[0-9]{2,3}\-)?([2-9][0-9]{6,7})+(\-[0-9]{1,4})?$/
						.test(value)) {
						return false;
					}
					return true;
				}
			},
			idcard: { //身份证号
				test: function (value) {
					if (!/^[1-9]\d{5}\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{2}$/
						.test(value) &&
						!/^[1-9]\d{5}(18|19|([23]\d))\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/
						.test(value)) {
						return false;
					}
					return true;
				}
			},
			date: /^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2})$/, //日期
			time: /^((20|21|22|23|[0-1]\d)\:[0-5][0-9])(\:[0-5][0-9])?$/, //时间
			datetime: /^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2}) (\d{1,2}):(\d{1,2}):(\d{1,2})$/, //日期时间
			integer: /^[-\+]?\d+$/, //整数
			number: /^\d{1,10}(\.\d{1,10})?$/, //数字
			email: /^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/, //邮箱
		}
	});

	valid.core = validCore;
	valid.util = validUtil;
})(valid, this);

if (typeof Object.assign != 'function') {
	Object.assign = function(target) {
	  'use strict';
	  if (target == null) {
		throw new TypeError('Cannot convert undefined or null to object');
	  }
   
	  target = Object(target);
	  for (var index = 1; index < arguments.length; index++) {
		var source = arguments[index];
		if (source != null) {
		  for (var key in source) {
			if (Object.prototype.hasOwnProperty.call(source, key)) {
			  target[key] = source[key];
			}
		  }
		}
	  }
	  return target;
	};
  }
  Object.assign(window, view);