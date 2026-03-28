import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { spawn } from "child_process";

export const runtime = "nodejs";

function parseJsonFromOutput(output: string): Record<string, unknown> | null {
  const lines = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .reverse();

  for (const line of lines) {
    try {
      return JSON.parse(line) as Record<string, unknown>;
    } catch {
      continue;
    }
  }

  return null;
}

async function runPythonPipeline(imagePath: string): Promise<Record<string, unknown>> {
  const rootDir = process.cwd();
  const scriptPath = path.join(rootDir, "scripts", "extract_plate_pipeline.py");

  const pythonExec = process.env.ALPR_PYTHON_EXECUTABLE || "python";
  const pythonArgs = (process.env.ALPR_PYTHON_ARGS || "")
    .split(" ")
    .map((arg) => arg.trim())
    .filter(Boolean);

  const pipelineArgs = [scriptPath, "--image", imagePath];

  if (process.env.ALPR_MODELS_DIR) {
    pipelineArgs.push("--models-dir", process.env.ALPR_MODELS_DIR);
  }

  if (process.env.ALPR_CITY_ANNOTATIONS) {
    pipelineArgs.push("--city-annotations", process.env.ALPR_CITY_ANNOTATIONS);
  }

  if (process.env.ALPR_CHAR_ANNOTATIONS) {
    pipelineArgs.push("--char-annotations", process.env.ALPR_CHAR_ANNOTATIONS);
  }

  if (process.env.ALPR_CITY_LABEL_FILE) {
    pipelineArgs.push("--city-label-file", process.env.ALPR_CITY_LABEL_FILE);
  }

  if (process.env.ALPR_CHAR_LABEL_FILE) {
    pipelineArgs.push("--char-label-file", process.env.ALPR_CHAR_LABEL_FILE);
  }

  return new Promise((resolve, reject) => {
    const child = spawn(pythonExec, [...pythonArgs, ...pipelineArgs], {
      cwd: rootDir,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
      shell: false,
      env: {
        ...process.env,
        KMP_DUPLICATE_LIB_OK: process.env.KMP_DUPLICATE_LIB_OK || "TRUE",
      },
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (err) => {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        reject(
          new Error(
            `Python executable not found: ${pythonExec}. Set ALPR_PYTHON_EXECUTABLE in .env.local to your Python path.`
          )
        );
        return;
      }
      reject(err);
    });

    child.on("close", (code) => {
      const parsed = parseJsonFromOutput(stdout);

      if (parsed && parsed.success === true) {
        resolve(parsed);
        return;
      }

      const pipelineError =
        (parsed?.error as string | undefined) ||
        stderr.trim() ||
        stdout.trim() ||
        `Python pipeline exited with code ${code}`;

      const missingModuleMatch = /ModuleNotFoundError: No module named '([^']+)'/i.exec(
        pipelineError
      );

      if (missingModuleMatch) {
        const missingModule = missingModuleMatch[1];
        reject(
          new Error(
            `Missing Python module '${missingModule}' in ALPR runtime. ` +
              `Set ALPR_PYTHON_EXECUTABLE to the interpreter that has your ML packages installed.`
          )
        );
        return;
      }

      reject(new Error(pipelineError));
    });
  });
}

export async function POST(req: NextRequest) {
  let tempImagePath = "";

  try {
    const formData = await req.formData();
    const image = formData.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 });
    }

    if (!image.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    const imageBuffer = Buffer.from(await image.arrayBuffer());
    const safeName = image.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    tempImagePath = path.join(os.tmpdir(), `plate_${Date.now()}_${safeName}`);

    await fs.writeFile(tempImagePath, imageBuffer);

    const result = await runPythonPipeline(tempImagePath);
    const plate = String(result.plate || "").trim();

    if (!plate) {
      return NextResponse.json(
        { error: "No plate text detected by the model" },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      plate,
      raw: result,
    });
  } catch (error) {
    console.error("Plate extraction error:", error);
    const message = error instanceof Error ? error.message : "Failed to extract plate";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (tempImagePath) {
      await fs.unlink(tempImagePath).catch(() => undefined);
    }
  }
}
