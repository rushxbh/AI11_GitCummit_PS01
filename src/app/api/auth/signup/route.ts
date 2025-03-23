import { NextResponse } from "next/server";
import { generateToken } from "@/utils/auth";
import User from "@/models/User";
import dbConnect from "@/utils/db";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { email, password, name } = await request.json();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "Email already registered" },
        { status: 400 }
      );
    }

    // Create new user
    const user = new User({
      name,
      email,
      password, // Password will be hashed by the pre-save middleware
    });

    await user.save();

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
    });

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (error: unknown) {
    console.log(error)
    return NextResponse.json(
      { message: "Failed to create account" },
      { status: 500 }
    );
  }
}
