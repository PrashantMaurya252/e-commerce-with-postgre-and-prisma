import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import bcrypt from "bcryptjs";
import { success, z } from "zod";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import { generateOtp, sendOtpMail } from "../utils/mailer.js";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../middlewares/auth.js";
import { OAuth2Client } from "google-auth-library";
import { createSession } from "../services/auth.service.js";


// import { emailQueues } from "../queues/email.queues.js";

const signupSchema = z.object({
  email: z.string(),
  username: z.string().min(3),
  password: z.string().min(6),
});
export const signUp = async (req: Request, res: Response) => {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        errors: parsed.error,
      });
    }
    const { email, username, password } = parsed.data;

    const isExist = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (isExist) {
      return res.status(400).json({
        success: false,
        message: "User already exist with this email ! try another one",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        email: email,
        name: username,
        password: hashedPassword,

      },
    });

    // await emailQueues.add("Send Welcome Email",{
    //   to:email,
    //   subject:"Welcome to our platform",
    //   html:"<h1>Welcome to our platform</h1>"
    // },{
    //   attempts:3,
    //   backoff:{
    //     type:"exponential",
    //     delay:5000
    //   },
    //   removeOnComplete:true
    // })

    res
      .status(201)
      .json({ success: true, message: "user created successfully" });
  } catch (error: any) {
    console.error("error in signup", error);
    return res.status(500).json({
      success: false,
      message: "Server Not responding",
    });
  }
};

const loginSchema = z.object({
  email: z.string(),
  password: z.string().min(6),
});
export const login = async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error,
      });
    }
    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    console.log("User", user)
    if (user && user.provider === "GOOGLE") {
      return res
        .status(400)
        .json({
          success: false,
          message: "This email already exist with google login",
        });
    }
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Credentials wrong",
      });
    }
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: "Credentials wrong",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Credentials wrong",
      });
    }

    console.log("User Roles", user.userRoles)
    const isAdminCalculated = user.userRoles?.some((ur) => ur.role.isSystemRole) ?? false;
    const userPayload = {
      userId: user.id,
      email: user.email,
      name: user.name ?? "",
      userRoles: user?.userRoles.map(role => role.role.name),
      isAdmin: isAdminCalculated,
    };
    const { password: _, createdAt, ...rest } = user;
    const userData = { ...rest, isAdmin: isAdminCalculated };
    const accessToken = generateAccessToken(userPayload);
    const session = await createSession(user.id, req);

    res.cookie("refresh-token", session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    res.cookie("access-token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    return res.status(200).json({
      success: true,
      data: {
        userData,
        // accessToken,
      },
    });
  } catch (error) {
    console.error("login error", error);
    return res.status(500).json({
      success: false,
      message: "Server not working",
    });
  }
};

export const sendEmailVerificationOtp = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId, email } });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const otp = generateOtp();
    await prisma.otp.create({
      data: {
        email,
        code: otp,
        type: "EMAIL_VERIFICATION",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    await sendOtpMail(email, otp, "Verify Email");
    return res
      .status(200)
      .json({
        success: true,
        message:
          "Verification Otp Send to your mail and it is valid for 5 minutes",
      });
  } catch (error) {
    console.error("sendEmailVerificationOtp error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const verifyEmailOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const record = await prisma.otp.findFirst({
      where: {
        email,
        code: otp,
        type: "EMAIL_VERIFICATION",
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!record) {
      return res.status(400).json({ success: false, message: "invalid OTP" });
    }

    await prisma.$transaction([
      prisma.otp.update({
        where: { id: record.id },
        data: { isUsed: true },
      }),
      prisma.user.update({
        where: { email },
        data: { isVerified: true },
      }),
    ]);
    return res.json({ success: true, message: "Email Verified" });
  } catch (error) {
    console.error("verify email otp error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const sendForgotPasswordOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    const otp = generateOtp();
    const record = await prisma.otp.create({
      data: {
        email,
        code: otp,
        type: "FORGOT_PASSWORD",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    await sendOtpMail(email, otp, "Reset Password");
    return res
      .status(200)
      .json({
        success: true,
        message: "Forgot password otp sent to your email",
      });
  } catch (error) {
    console.error("send forgot password otp error ", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const verifyForgotPasswordOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const record = await prisma.otp.findFirst({
      where: {
        email,
        code: otp,
        type: "FORGOT_PASSWORD",
        expiresAt: { gt: new Date() },
      },
    });
    if (!record) {
      return res.status(404).json({ success: false, message: "Invalid Otp" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    prisma.$transaction([
      prisma.otp.update({ where: { id: record.id }, data: { isUsed: true } }),
      prisma.user.update({
        where: { email },
        data: { password: hashedPassword },
      }),
    ]);

    return res
      .status(200)
      .json({ success: true, message: "Password Updated Successfully" });
  } catch (error) {
    console.error("verify forgot password otp", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const token = req.cookies["refresh-token"];
    if (!token)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.expiresAt < new Date()) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { lastUsedAt: new Date() }
    })

    const payload = jwt.verify(
      token,
      process.env.JWT_REFRESH_TOKEN_SECRET!,
    ) as any;
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const isAdminCalculated = user.userRoles?.some((ur) => ur.role.isSystemRole) ?? false;
    const userPayload = {
      userId: user.id,
      email: user.email,
      name: user.name ?? "",
      isAdmin: isAdminCalculated,
      userRoles: user.userRoles.map((userRole) => userRole.role.name)
    };
    const newAccessToken = generateAccessToken(userPayload);
    return res.status(200).json({ success: true, accessToken: newAccessToken });
  } catch (error) {
    console.error("refresh token error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const me = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user?.userId },
      select: { id: true, email: true, name: true, userRoles: { include: { role: true } } },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isAdminCalculated = user.userRoles?.some((ur) => ur.role.isSystemRole) ?? false;
    const { userRoles: _, ...rest } = user;
    const responseUser = { ...rest, isAdmin: isAdminCalculated };

    return res.status(200).json({ success: true, user: responseUser });
  } catch (error) {
    console.error("me controller error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const refreshToken = req.cookies["refresh-token"];
    if (!userId || !refreshToken) {
      return res.status(401).json({ success: false, message: "Unauthorized in logout" });
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized in logout" });
    }

    await prisma.refreshToken.updateMany({
      where: { userId: userId, token: refreshToken },
      data: { isRevoked: true, revokedAt: new Date() }
    });
    res.clearCookie("refresh-token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.clearCookie("access-token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    return res
      .status(200)
      .json({ success: true, message: "User logout successfully" });
  } catch (error) {
    console.error("logout error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const logoutFromAllDevices = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId
    const user = await prisma.user.findFirst({ where: { id: userId } })
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" })
    }
    await prisma.refreshToken.updateMany({ where: { userId }, data: { isRevoked: true, revokedAt: new Date() } })

    res.clearCookie("refresh-token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.clearCookie("access-token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    return res
      .status(200)
      .json({ success: true, message: "User logout from all devices successfully" });
  } catch (error) {
    console.log("Logout from all devices error", error)
    return res.status(500).json({ success: false, message: "Internal Server Error" })
  }
}

export const logoutFromParticularDevice = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.userId
    const { sessionId } = req.body
    const user = await prisma.refreshToken.findUnique({ where: { id: userId } })
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" })
    }
    const session = await prisma.refreshToken.findUnique({ where: { id: sessionId } })
    if (!session || session.userId !== userId) {
      return res.status(401).json({ success: false, message: "Invalid Session" })
    }
    await prisma.refreshToken.update({
      where: { id: sessionId },
      data: { isRevoked: true, revokedAt: new Date() }
    })

    return res.status(200).json({ success: true, message: "User logout from particular device successfully" })
  } catch (error) {
    console.log("Logout from particular device error", error)
    return res.status(500).json({ success: false, message: "Internal Server Error" })
  }
}
export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({
        success: false,
        message: "Invalid Google Token",
      });
    }
    const { email, sub, name, picture } = payload;

    const userExist = await prisma.user.findUnique({
      where: { email }, include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });
    if (userExist && userExist.provider === "LOCAL") {
      return res.status(400).json({
        success: false,
        message: "User already exist with email & passowrd",
      });
    }

    let user;
    if (userExist && userExist.provider === "GOOGLE") {
      user = userExist;
    } else {
      user = await prisma.user.create({
        data: {
          email,
          name,
          googleId: sub,
          provider: "GOOGLE",
          avatar: picture,
          isVerified: true,
        },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });
    }

    const isAdminCalculated = user.userRoles?.some((ur) => ur.role.isSystemRole) ?? false;
    const userPayload = {
      userId: user.id,
      email: user.email,
      name: user.name ?? "",
      isAdmin: isAdminCalculated,
      userRoles: user.userRoles.map((userRole) => userRole.role.name)
    };
    const { password: _, createdAt, ...rest } = user;
    const userData = { ...rest, isAdmin: isAdminCalculated };
    const accessToken = generateAccessToken(userPayload);
    const refreshToken = generateRefreshToken({ userId: user.id });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.cookie("refresh-token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    return res
      .status(200)
      .json({
        success: true,
        message: "User Logged In Successfully",
        data: { userData, accessToken },
      });
  } catch (error) {
    console.error("Google Auth Error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const getSessions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.userId
    const sessions = await prisma.refreshToken.findMany({
      where: { userId, isRevoked: false, expiresAt: { gt: new Date() } },
      select: {
        id: true,
        deviceName: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
      },
      orderBy: { lastUsedAt: "desc" }
    })
    return res.status(200).json({
      success: true,
      message: "Sessions fetched successfully",
      data: { sessions }
    })
  } catch (error) {
    console.log("Get sessions error", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" })
  }
}
