"use strict";

const postgreConnection = require("../apps/helpers/sequelizeHelper");

const moment = require("moment");
const { writeLog } = require("../apps/helpers/utils");

module.exports = class EmailService {
  static async EmailRequest(objUser) {
    let objResponse;
    let pobj;
    objResponse.GetStatus = false;
    try {
        let userDetails = await EmailService.verifyUser(objUser.UserName);
        if (userDetails != "" && userDetails.length > 0){
            let UserId = userDetails[0]["registrationid"];
            let UserEmail = userDetails[0]["emailid"];
            let MobileNo = userDetails[0]["mobileno"];

            writeLog("EmailRquest : UserId UserEmail MobileNo " + UserId + " " + UserEmail + " " + MobileNo);

            let OTPCode = await EmailService.GenerateOTPCode(OTPCode);

            let config_type = "ForgetPassword";
            let ReplaceOTP = "@@Forget_OTP";
            if (objUser.Request_Type == 2)
            {
                config_type = "ChangePassword";
                ReplaceOTP = "@@Change_OTP";
            }
            
            let sender = `SELECT * FROM tbl_comn_communication_configuration WHERE lower(config_type) = ${config_type} AND isactive=TRUE;`;
            let senderResult = postgreConnection.query(sender);
            if (senderResult != null && senderResult.length > 0)
            {
                let AlertMailSubject = EmailService.GetColumnValueUsingColValueFromDt(senderResult, "config_name", "Alert Mail Subject", "config_value", -1);
                let AlertMailBody = EmailService.GetColumnValueUsingColValueFromDt(senderResult, "config_name", "Alert Mail Body HTML", "config_value", -1);
                let MailFormat = AlertMailBody.Replace(ReplaceOTP, OTPCode);
                
                objResponse.GetStatus = await EmailService.SaveOTP(OTPCode, UserId, objUser.Request_Type, objUser.Devicetype, objUser.AppName);
                if(objResponse.GetStatus){
                    let msg = "";
                    if(UserEmail != ""){
                        try {
                            await EmailService.SendEmail(OTPCode, UserEmail, MailFormat, AlertMailSubject);
                            writeLog("EmailRquest = Mail Sent");
                        } catch (err) {
                            objResponse.GetStatus = false;
                            objResponse.GetMessage = "The SMTP server is not set up and we cannot process that request.";
                            writeLog("EmailRquest = " + objResponse.GetMessage);
                            return objResponse;
                        }
                        msg = "Email"
                    }
                    let SmsResult = "";
                    let IsException = false;
                    if (objUser.AppName == "") {
                        objUser.AppName = "retail eazy";
                    }
                    writeLog(`EmailRquest = SMS Start OTPCode=${OTPCode}  MobileNo = ${MobileNo} AppName = ${objUser.AppName.toLower()}  Configtype = ${config_type}`);
                    pobj.SendSMS("TEXTLOCAL", OTPCode, MobileNo, 0, objUser.AppName.toLower(), config_type, IsException, SmsResult);
                    // SendOTPMobile(OTPCode, MobileNo);
                    objResponse.GetMessage = "OTP has been sent to your " + msg + "Mobile No.";
                } else{
                    objResponse.GetMessage = "OTP sending failed.";
                }
            }else{
                objResponse.GetMessage = "Confriguration not found.";
            }
        } else {
            objResponse.GetMessage = "Invalid credential.";
        }
    } catch (e) {
        objResponse.GetStaus = false;
        objResponse.GetMessage = "we cannot process that request.";
        throw e;
    }
    return objResponse;
  }

  static async verifyUser(userName){
    let sQuery = `SELECT * FROM tbl_registration WHERE isactive=TRUE AND (lower(emailid) = ${userName} or mobileno = ${userName} )`;
    let dt = await postgreConnection.query(sQuery);
    return dt;
  }
  static async GenerateOTPCode(dt,colname,colvalue,returncolname, rowIndex=-1){
    let data = "";
    if (rowIndex === -1) {
        dt[0].forEach(element => {
            let dr = element[colname]
            let returnColname = element[returncolname]
            if(dr===colvalue){
                data = returnColname.toString();
                // break;
            }
        });
        
    } else {
        data = dt[rowIndex][colname].toString();
    }
    return data;
  }
  static async SaveOTP(OTP, userId, otp_type, devicetype, appname){
    let status = false;
    let squery = `UPDATE tbl_userotp SET isexpired = true,devicetype= ${devicetype}   WHERE isused=FALSE and isexpired=FALSE AND userid = ${UserId} Returning id `;
    await postgreConnection.query(squery);

    var queryUserVerified = `insert into tbl_userotp (userid, otp_code,otp_type,devicetype,remark) VALUES(${UserId},${OTP},${otp_type},${devicetype},${appname}) returning id`;
    writeLog(`Verified Code resend Insert Query ${queryUserVerified}`);

    status = await postgreConnection.query(queryUserVerified);
    return status;
  }
  static async SendSMS(APIType, OTPode, ContactNo, brandid, appname, config_type, IsSmsException, SmsResult){
    IsSmsException = false;
    SmsResult = "";
    if (OTPode != "" && ContactNo != "")
    {
        if (APIType == "TEXTLOCAL")
        {
            SendSMSTextLocalAPI(OTPode, ContactNo, brandid, appname, config_type, IsSmsException, SmsResult);
        }
        if (APIType == "NETCORE")
        {
            SendSMSNetCore(OTPode, ContactNo, brandid, appname, IsSmsException, SmsResult);
        }
    }
  }
  static async SendSMSNetCore(OTP, MobileNo, brandid, appname, IsException, SmsResult){
    IsException = false;
    SmsResult = "";
    try {
        
    } catch (e) {
        
    }
  }
}