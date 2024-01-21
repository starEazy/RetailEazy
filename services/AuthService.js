"use strict";

const { writeLog } = require("../apps/helpers/utils");
const postgreConnection = require("../apps/helpers/sequelizeHelper");
const { buildToken, stringDecrypt } = require("../apps/JWT/encrypt-decrypt");
const { Jwt } = require("../apps/JWT/jwt");
const { response } = require("express");

class AuthService {
  static async customerAuth(userCredential) {
    try {
      writeLog(new Date().toString());
      let response = null;
      try {
        let dt;

        if (userCredential.IsOTPLogin === true) {
          let expireTime = 0;
          let userRegId = 0;
          let userPwd = "";

          // Retrieve user information based on mobile number
          const userQuery = `SELECT reg.registrationid, reg.username, reg.mobileno, reg.loginuserpassword 
                         FROM tbl_registration reg 
                         WHERE reg.isactive = TRUE AND reg.mobileno = '${userCredential.Username}'`;
          writeLog(`IsOTPLogin Login Query ${userQuery}`);
          dt = await postgreConnection.query(userQuery);
          writeLog(new Date().toString());

          if (dt.length === 1) {
            userRegId = dt[0].registrationid;
            userPwd = dt[0].loginuserpassword;

            // Retrieve OTP expire time from global settings
            const otpExpireQuery = `SELECT value as otp_minute FROM tbl_globalsettings 
                                WHERE lower(itemkeyname) = lower('LogIn_OTP_Validity_Minute') AND isactive = true`;
            writeLog(`---Check OTP Expire time Query---  ${otpExpireQuery}`);
            dt = await postgreConnection.query(otpExpireQuery);

            if (dt.length === 1) {
              expireTime = dt[0].otp_minute;

              // Retrieve unexpired OTP code and its creation time
              const userOtpQuery = `SELECT (EXTRACT(DAY from age(now(), createdon))*24*60)+(EXTRACT(HOUR from age(now(), createdon))*60)+(EXTRACT(MINUTE from age(now(), createdon))) as totalminute, * 
                                FROM tbl_userotp 
                                WHERE isused = FALSE AND isexpired = FALSE AND otp_type = 3 AND userid = ${userRegId}`;
              writeLog(
                `---User Verified Code and Time Query---  ${userOtpQuery}`
              );
              dt = await postgreConnection.query(userOtpQuery);

              if (
                dt.length === 1 &&
                dt[0].otp_code === userCredential.OTPLoginPassword.toString()
              ) {
                const totalMinute = dt[0].totalminute;

                if (totalMinute <= expireTime && totalMinute >= 0) {
                  // Mark OTP as used
                  const updateOtpQuery = `UPDATE tbl_userotp SET isused = true, devicetype = ${userCredential.Devicetype} 
                                       WHERE otp_type = 3 AND isused = FALSE AND isexpired = FALSE AND userid = ${userRegId}`;
                  await postgreConnection.query(updateOtpQuery);

                  userCredential.Password = userPwd;
                } else {
                  response = {
                    UserId: 0,
                    message:
                      "OTP has been expired, kindly re-send the OTP to try again.",
                  };
                  return response;
                }
              } else {
                response = { UserId: 0, message: "Invalid OTP" };
                return response;
              }
            }
          }
        }

        // Retrieve user information based on email or mobile number and password
        const loginQuery = `SELECT reg.registrationid, reg.username, reg.emailid, reg.mobileno, reg.loginuserpassword, 
                                reg.address, lm.cityid, reg.pincode, kyc.gstnno, reg.latitude, reg.longitude, reg.isactive,
                                to_char(reg.alteredon, 'yyyy-mm-dd HH24:mi:ss') as alteredon, lm.stateid, kyc.panno, 
                                kyc.paytmmobileno, kyc.upi_id, reg.userimageurl, reg.isactivebill, kyc.licenceno, kyc.adharcardno,
                                kyc.votercardno, to_char(lm.dateofbirth, 'dd-mm-yyyy') as dateofbirth, 
                                to_char(lm.dateofanniversary, 'dd-mm-yyyy') as dateofanniversary 
                         FROM tbl_registration reg 
                         LEFT JOIN tbl_registration_kycdetail kyc ON reg.registrationid = kyc.registrationid 
                         LEFT JOIN tbl_ledgermaster lm ON reg.registrationid = lm.registrationid 
                         WHERE reg.isactive = TRUE 
                         AND (lower(reg.emailid) = '${userCredential.Username.toLowerCase()}' OR reg.mobileno = '${
          userCredential.Username
        }') 
                         AND reg.loginuserpassword = '${
                           userCredential.Password
                         }'`;

        writeLog(`Login Query ${loginQuery}`);
        dt = await postgreConnection.query(loginQuery);
        writeLog(new Date().toString());
        writeLog(`Dt Count ${dt.length}`);

        if (dt.length > 0) {
          response = {
            UserId: dt[0].registrationid,
            Username: dt[0].username,
            email: dt[0].emailid,
            mobileno: dt[0].mobileno,
            password: dt[0].loginuserpassword,
            address: dt[0].address,
            cityid: dt[0].cityid,
            pincode: dt[0].pincode,
            gstnno: dt[0].gstnno,
            latitude: dt[0].latitude,
            longitude: dt[0].longitude,
            stateid: dt[0].stateid,
            panno: dt[0].panno,
            paytmmobileno: dt[0].paytmmobileno,
            upi_id: dt[0].upi_id,
            alteredon: dt[0].alteredon,
            is_active: dt[0].isactive,
            userimageurl: dt[0].userimageurl,
            isactivebill: dt[0].isactivebill,
            licenceno: dt[0].licenceno,
            adharcardno: dt[0].adharcardno,
            votercardno: dt[0].votercardno,
            dateofbirth: dt[0].dateofbirth,
            dateofanniversary: dt[0].dateofanniversary,
          };

          // Additional logic for GreenSamriddhi / Green Bandhan
          const dtBrand =
            await postgreConnection.query(`SELECT distinct brandid 
                                                      FROM tbl_userdesignationmapping 
                                                      WHERE userid = ${parseInt(
                                                        dt[0].registrationid
                                                      )} 
                                                      LIMIT 1`);

          for (let i = 0; i < dtBrand.length; i++) {
            if (
              userCredential.loginappname.toLowerCase() === "greensamriddhi" ||
              userCredential.loginappname.toLowerCase() === "green bandhan"
            ) {
              const logintypeQuery = `SELECT distinct logintypeid 
                                  FROM tbl_userdesignationmapping 
                                  WHERE brandid = ${parseInt(
                                    dtBrand[i].brandid
                                  )} 
                                  AND userid = ${parseInt(
                                    dt[0].registrationid
                                  )} 
                                  LIMIT 1`;

              response.LoginTypeId = await postgreConnection.getSingleData(
                logintypeQuery
              );

              response.LoginTypeName = await postgreConnection.getSingleData(
                `SELECT logintypename 
                FROM tbl_logintypemaster 
                 WHERE logintypeid = ${response.LoginTypeId}`
              );

              if (
                (userCredential.loginappname.toLowerCase() ===
                  "greensamriddhi" &&
                  response.LoginTypeId !== 6) ||
                (userCredential.loginappname.toLowerCase() ===
                  "green bandhan" &&
                  response.LoginTypeId === 6)
              ) {
                response = {
                  UserId: 0,
                  message: "You are not registered for this app",
                };
                return response;
              }
            }
          }

          // End of additional logic

          // Additional logic for active sessions
          if (userCredential.IsForcefullyLogout === true) {
            await postgreConnection.query(
              `UPDATE tbl_mobilesessiondetail 
                                              SET LogoutTIme = now(), isactivesession = false 
                                              WHERE UserID = ${response.UserId} AND isactivesession = true`,
              "update"
            );
          }

          const activeSessionCountQuery = `SELECT count(1)  
                                       FROM tbl_mobilesessiondetail tm 
                                       WHERE isactivesession = true AND userid = '${response.UserId}' AND imeinumber <> '${userCredential.imei_no}'`;

          response.Activesessioncount = await postgreConnection.getSingleData(
            activeSessionCountQuery
          );

          response.PoOrderNo = "0";

          // Get token and update headers

          const login_token = new Jwt().createToken(
            { user_id: response.UserId },
            { expiresIn: "365d" }
          );
          // const token = buildToken(response.UserId);

          response.login_token = login_token;

          writeLog("Token Generate Done  ");
          postgreConnection.insertNewToken(
            userCredential,
            response.UserId,
            login_token
          );

          writeLog(new Date().toString());
        } else {
          response = null;
        }
      } catch (error) {
        throw error;
      }
      return response;
      //   };
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  static async APP_UserLogOut(JsonObject) {
    writeLog(("UserLogOut Json", JsonObject));
    let squery = "";
    let response;
    const requeststr = JSON.stringify(JsonObject);
    if (!requeststr) return null;

    const mstdetails = JSON.parse(requeststr);

    squery =
      "SELECT DISTINCT tu.userid FROM tbl_userdesignationmapping tu " +
      "INNER JOIN tbl_brandmaster tb ON tu.brandid = tb.brandid AND tb.brandcode = $1 " +
      "INNER JOIN tbl_registration tr ON tu.userid = tr.registrationid " +
      "WHERE tu.dmsledgercode = $2 AND tr.mobileno = $3";

    writeLog(("APP_UserLogOut Save Query", squery));

    const Reguserid = await postgreConnection.selectWithValues(squery, [
      mstdetails.BrandCode,
      mstdetails.LedgerCode,
      mstdetails.MobileNo,
    ]);

    const user_id = Reguserid[0].userid;

    if (user_id > 0) {
      squery =
        "UPDATE tbl_mobilesessiondetail SET remarks = $1, " +
        "LogoutTIme = now(), isactivesession = false WHERE UserID = $2 AND isactivesession = true";

      await postgreConnection.updateWithValues(squery, [
        mstdetails.Remarks == null,
        user_id,
      ]);
    }

    return (response = user_id);
  }

  static async IsDownLoadApp(Uri) {
    const objresp = {
      URL: "",
      TallyExpiry_date: "01-Jan-2023",
      ClientID: "",
      status: false,
      Result: "",
    };

    try {
      if (!Uri) {
        return objresp;
      }

      const clientUrl = stringDecrypt(Uri, null, null, true);
      if (!clientUrl) {
        return objresp;
      }

      const query = `SELECT * FROM agencymaster WHERE (lower(agencycode) = LOWER('${clientUrl}') OR lower(agencyname) = lower('${clientUrl}')) AND inactive=false`;

      const result = await postgreConnection.query(query);

      if (result.length === 1) {
        objresp.URL = result[0].weburl;
        objresp.ClientID = result[0].client_id.toString();
        objresp.status = true;
        objresp.Result = "Authentication Successfully";
      } else {
        objresp.status = false;
        objresp.Result = "Client Name OR Client Url Wrong.";
      }

      return objresp;
    } catch (error) {
      console.log(error);
      return objresp;
    }
  }

  static async updateProfile(objupdateprofile, UserId) {
    try {
      const squery = `UPDATE tbl_registration SET 
                      address = $1, 
                      cityid = $2, 
                      pincode = $3, 
                      stateid = $4, 
                      latitude = $5, 
                      longitude = $6, 
                      devicetype = $7, 
                      alteredon = now() 
                      WHERE registrationid = $8 
                      RETURNING registrationid`;

      const values = [
        objupdateprofile.address,
        objupdateprofile.cityid,
        objupdateprofile.pincode,
        objupdateprofile.stateid,
        objupdateprofile.latitude,
        objupdateprofile.longitude,
        objupdateprofile.Devicetype,
        UserId,
      ];
      writeLog(`Profile Update Query   ${squery}`);

      await postgreConnection.updateWithValues(squery, values);
      await AuthService.updateDOB_DOA(objupdateprofile, UserId, client); // Assuming this is another function to be converted to JS

      return { GetStaus: true, GetMessage: "Profile Update successfully." };
    } catch (ex) {
      return { GetStaus: false, GetMessage: ex.message };
    }
  }

  static async updateDOB_DOA(objupdateprofile, userid) {
    try {
      let cityname = null;

      let squery = "SELECT cityname FROM tbl_citymaster WHERE cityid = $1";
      const cityRes = await postgreConnection.selectWithValues(squery, [
        objupdateprofile.cityid,
      ]);
      if (cityRes.length > 0) {
        cityname = cityRes[0].cityname;
      }

      squery =
        "SELECT DISTINCT lm.ledgercode, bm.brandcode, bm.brand_url, lm.ledgerid, lm.brandid " +
        "FROM tbl_registration z " +
        "INNER JOIN tbl_userdesignationmapping z1 ON z.registrationid = z1.userid " +
        "INNER JOIN tbl_ledgermaster lm ON lm.ledgercode = z1.dmsledgercode AND lm.brandid = z1.brandid " +
        "INNER JOIN tbl_brandmaster bm ON bm.brandid = z1.brandid " +
        "WHERE z.registrationid = $1";

      const ledgerRes = await postgreConnection.selectWithValues(squery, [
        userid,
      ]);

      for (let i = 0; i < ledgerRes.length; i++) {
        const ledger = ledgerRes[i];
        squery =
          "SELECT cityid, stateid FROM tbl_citymaster WHERE cityname = $1 AND brandid = $2";
        const cityStateRes = await postgreConnection.selectWithValues(squery, [
          cityname,
          ledger.brandid,
        ]);

        let cityid = 0,
          stateid = 0;
        if (cityStateRes.length > 0) {
          cityid = cityStateRes[0].cityid;
          stateid = cityStateRes[0].stateid;
        }

        squery =
          "UPDATE tbl_ledgermaster SET alteredon = CURRENT_TIMESTAMP, isdmsupdate = true, " +
          "dateofbirth = $1, cityid = $2, stateid = $3, dateofanniversary = $4 " +
          "WHERE ledgerid = $5";
        await postgreConnection.selectWithValues(squery, [
          objupdateprofile.dateofbirth || null,
          cityid,
          stateid,
          objupdateprofile.dateofanniversary || null,
          ledger.ledgerid,
        ]);
      }

      return true;
    } catch (error) {
      console.log();
      "UpdateDOB_DOA error:", error;
      return false;
    }
  }

  static async changePasswordRequest(objChangePassword, UserId) {
    try {
      objChangePassword.oldpassword = objChangePassword.oldpassword || "";
      objChangePassword.newpassword = objChangePassword.newpassword || "";
      objChangePassword.OTP = objChangePassword.OTP || "";

      let squery =
        "SELECT config_value FROM tbl_comn_communication_configuration WHERE LOWER(config_type) = LOWER('ChangePasswordExpireTime') AND isactive = TRUE";
      const configRes = await postgreConnection.query(squery);

      if (configRes.length === 1) {
        const expireTime = parseInt(configRes[0].config_value);

        const passwordRes = await postgreConnection.selectWithValues(
          "SELECT loginuserpassword FROM tbl_registration WHERE registrationid = $1",
          [UserId]
        );
        if (
          passwordRes.length === 0 ||
          passwordRes[0].loginuserpassword !== objChangePassword.oldpassword
        ) {
          return {
            GetStatus: false,
            GetMessage: "Old Password Not Match!!!!.",
          };
        }

        squery =
          "SELECT (EXTRACT(EPOCH FROM age(now(),createdon))/60) AS totalminute, otp_code " +
          "FROM tbl_userotp WHERE isused = FALSE AND isexpired = FALSE AND otp_type = 2 AND userid = $1";
        const otpRes = await postgreConnection.selectWithValues(squery, [
          UserId,
        ]);

        if (
          otpRes.length === 1 &&
          otpRes[0].otp_code === objChangePassword.OTP
        ) {
          const totalMinute = parseInt(otpRes[0].totalminute);

          if (totalMinute <= expireTime && totalMinute >= 0) {
            await postgreConnection.updateWithValues(
              "UPDATE tbl_registration SET loginuserpassword = $1 WHERE registrationid = $2",
              [objChangePassword.newpassword, UserId]
            );
            await postgreConnection.updateWithValues(
              "UPDATE tbl_userotp SET isused = TRUE, devicetype = $1 WHERE isused = FALSE AND isexpired = FALSE AND userid = $2",
              [objChangePassword.Devicetype, UserId]
            );

            return {
              GetStatus: true,
              GetMessage: "Password change successfully.",
            };
          } else {
            return { GetStatus: false, GetMessage: "OTP is expired!!!!." };
          }
        } else {
          return { GetStatus: false, GetMessage: "Please enter valid OTP!!." };
        }
      }

      return {
        GetStatus: false,
        GetMessage: "Configuration error or missing data.",
      };
    } catch (ex) {
      console.log("ChangePasswordRequest error:", ex);
      return { GetStatus: false, GetMessage: ex.message };
    }
  }

  static async UpdateKYC(objupdatekyc, UserId) {
    try {
      let squery = "";
      let objResponse = {};

      const DtCheck = await postgreConnection.query(
        `Select * from tbl_registration_kycdetail Where registrationid=${UserId}`
      );

      if (DtCheck.length === 0) {
        squery = `Insert into tbl_registration_kycdetail (registrationid,gstnno,panno,paytmmobileno,upi_id,licenceno,adharcardno,votercardno,devicetype) values (${UserId},'${objupdatekyc.gstnno}','${objupdatekyc.panno}','${objupdatekyc.paytmmobileno}','${objupdatekyc.upi_id}','${objupdatekyc.licenceno}','${objupdatekyc.adharcardno}','${objupdatekyc.votercardno}',${objupdatekyc.Devicetype}) Returning registrationkycid `;
        writeLog(`UpdateKYC Query ${squery}`);
        objResponse.GetStaus = await postgreConnection.query(squery, "insert");
        await postgreConnection.query(
          `update tbl_registration Set alteredon=CURRENT_TIMESTAMP WHERE registrationid=${UserId}`,
          "update"
        );
      } else {
        squery = `UPDATE tbl_registration_kycdetail SET gstnno = '${objupdatekyc.gstnno}',panno='${objupdatekyc.panno}',paytmmobileno ='${objupdatekyc.paytmmobileno}',upi_id ='${objupdatekyc.upi_id}',licenceno ='${objupdatekyc.licenceno}',adharcardno ='${objupdatekyc.adharcardno}',votercardno ='${objupdatekyc.votercardno}',alteredon=now(),devicetype =${objupdatekyc.Devicetype} WHERE registrationid=${UserId} Returning registrationkycid `;
        writeLog(`Profile Update Query ${squery}`);
        objResponse.GetStaus = await postgreConnection.query(squery, "update");
        await postgreConnection.query(
          `update tbl_registration Set alteredon=CURRENT_TIMESTAMP WHERE registrationid=${UserId}`,
          "update"
        );
      }

      if (objResponse.GetStaus === true) {
        objResponse.GetMessage = "KYC Update successfully.";
      }

      return objResponse;
    } catch (error) {
      console.log(error);
    }
  }

  static async getGlobalSetting(type) {
    try {
      writeLog("---Get all Global Setting-- Stat- ");
      const squery =
        "Select globsettingid, itemkeyname, displayname, value from tbl_globalsettings order by 1;";
      writeLog(`---Get all Global Setting-- - ${squery}`);

      // postgreConnection = GetConnectionObj(type);

      const dt = await postgreConnection.query(squery);

      // console.log(">>>>>>>>>>>>>>",dt);
      writeLog(`---Get all Global Setting-- Cout -  ${dt.length}`);
      writeLog("---Get all Global Setting-- End ");

      return dt;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}

module.exports = AuthService;
