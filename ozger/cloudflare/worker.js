const DEFAULT_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

const PROFILE_FIELDS = [
  "username",
  "country",
  "city",
  "school",
  "class_number",
  "class_letter",
  "subject_combination",
  "subject1",
  "subject2",
  "avatar_url"
];

function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...DEFAULT_HEADERS,
      ...headers
    }
  });
}

function getBearerToken(request) {
  const authHeader = request.headers.get("Authorization") || "";
  const match = authHeader.match(/^Bearer (.+)$/i);
  return match ? match[1] : null;
}

function supabaseHeaders(env, token, useServiceRole = false) {
  const headers = new Headers();
  const apiKey = useServiceRole
    ? env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY
    : env.SUPABASE_ANON_KEY;
  headers.set("apikey", apiKey);
  headers.set("Authorization", `Bearer ${useServiceRole ? apiKey : token || ""}`);
  headers.set("Content-Type", "application/json");
  return headers;
}

async function getUserFromToken(env, token) {
  if (!token) return null;
  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) return null;
  return res.json();
}

async function handleMaterials(request, env) {
  const token = getBearerToken(request);
  const user = await getUserFromToken(env, token);
  if (!user?.id) {
    return jsonResponse({ error: "No authentication token provided" }, 401);
  }

  const url = new URL(request.url);
  const restBase = `${env.SUPABASE_URL}/rest/v1/materials`;
  const headers = supabaseHeaders(env, token);

  if (request.method === "GET") {
    const subject = url.searchParams.get("subject");
    const type = url.searchParams.get("type");
    const params = new URLSearchParams();
    params.set("select", "*");
    params.set("user_id", `eq.${user.id}`);
    if (subject && subject !== "all") params.set("subject", `eq.${subject}`);
    if (type && type !== "all") params.set("type", `eq.${type}`);
    params.set("order", "created_at.desc");

    const res = await fetch(`${restBase}?${params.toString()}`, { headers });
    if (!res.ok) {
      return jsonResponse({ error: "Failed to fetch materials" }, 500);
    }
    const data = await res.json();
    return jsonResponse({ materials: data });
  }

  if (request.method === "POST") {
    const body = await request.json();
    const payload = {
      user_id: user.id,
      title: body.title,
      content: body.content,
      subject: body.subject,
      type: body.type,
      is_public: Boolean(body.is_public)
    };
    const res = await fetch(restBase, {
      method: "POST",
      headers: {
        ...Object.fromEntries(headers.entries()),
        Prefer: "return=representation"
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      return jsonResponse({ error: "Failed to create material" }, 500);
    }
    const data = await res.json();
    return jsonResponse({ material: data?.[0] || null }, 201);
  }

  return jsonResponse({ error: "Method not allowed" }, 405);
}

async function handleFavorites(request, env) {
  const token = getBearerToken(request);
  const user = await getUserFromToken(env, token);
  if (!user?.id) {
    return jsonResponse({ error: "No authentication token provided" }, 401);
  }

  const restBase = `${env.SUPABASE_URL}/rest/v1/favorites`;
  const headers = supabaseHeaders(env, token);

  if (request.method === "GET") {
    const params = new URLSearchParams();
    params.set("select", "*,materials(*)");
    params.set("user_id", `eq.${user.id}`);
    const res = await fetch(`${restBase}?${params.toString()}`, { headers });
    if (!res.ok) {
      return jsonResponse({ error: "Failed to fetch favorites" }, 500);
    }
    const data = await res.json();
    return jsonResponse({ favorites: data });
  }

  if (request.method === "POST") {
    const body = await request.json();
    const materialId = body.material_id;
    if (!materialId) {
      return jsonResponse({ error: "Material ID is required" }, 400);
    }

    const checkParams = new URLSearchParams();
    checkParams.set("select", "id");
    checkParams.set("user_id", `eq.${user.id}`);
    checkParams.set("material_id", `eq.${materialId}`);
    const existingRes = await fetch(`${restBase}?${checkParams.toString()}`, { headers });
    if (!existingRes.ok) {
      return jsonResponse({ error: "Failed to check favorite" }, 500);
    }
    const existing = await existingRes.json();

    if (existing.length > 0) {
      const deleteParams = new URLSearchParams();
      deleteParams.set("user_id", `eq.${user.id}`);
      deleteParams.set("material_id", `eq.${materialId}`);
      const deleteRes = await fetch(`${restBase}?${deleteParams.toString()}`, {
        method: "DELETE",
        headers
      });
      if (!deleteRes.ok) {
        return jsonResponse({ error: "Failed to remove favorite" }, 500);
      }
      return jsonResponse({ message: "Favorite removed" });
    }

    const insertRes = await fetch(restBase, {
      method: "POST",
      headers: {
        ...Object.fromEntries(headers.entries()),
        Prefer: "return=representation"
      },
      body: JSON.stringify({
        user_id: user.id,
        material_id: materialId
      })
    });
    if (!insertRes.ok) {
      return jsonResponse({ error: "Failed to add favorite" }, 500);
    }
    const data = await insertRes.json();
    return jsonResponse({ favorite: data?.[0] || null });
  }

  return jsonResponse({ error: "Method not allowed" }, 405);
}

async function handleProfile(request, env) {
  const token = getBearerToken(request);
  const user = await getUserFromToken(env, token);
  if (!user?.id) {
    return jsonResponse({ error: "No authentication token provided" }, 401);
  }

  const restBase = `${env.SUPABASE_URL}/rest/v1/profiles`;
  const headers = supabaseHeaders(env, token);

  if (request.method === "GET") {
    const params = new URLSearchParams();
    params.set("select", "*");
    params.set("user_id", `eq.${user.id}`);
    params.set("limit", "1");
    const res = await fetch(`${restBase}?${params.toString()}`, { headers });
    if (!res.ok) {
      return jsonResponse({ error: "Failed to fetch profile" }, 500);
    }
    const data = await res.json();
    return jsonResponse({ profile: data?.[0] || null });
  }

  if (request.method === "PUT") {
    const body = await request.json();
    const update = { user_id: user.id, updated_at: new Date().toISOString() };
    for (const field of PROFILE_FIELDS) {
      if (body[field] !== undefined) {
        update[field] = body[field];
      }
    }

    const params = new URLSearchParams();
    params.set("on_conflict", "user_id");
    const res = await fetch(`${restBase}?${params.toString()}`, {
      method: "POST",
      headers: {
        ...Object.fromEntries(headers.entries()),
        Prefer: "resolution=merge-duplicates,return=representation"
      },
      body: JSON.stringify(update)
    });
    if (!res.ok) {
      return jsonResponse({ error: "Failed to update profile" }, 500);
    }
    const data = await res.json();
    return jsonResponse({ profile: data?.[0] || null });
  }

  return jsonResponse({ error: "Method not allowed" }, 405);
}

async function handleRating(request, env) {
  const startTime = Date.now();
  const url = new URL(request.url);
  const type = url.searchParams.get("type") || "ent";
  const subject = url.searchParams.get("subject");
  const scope = url.searchParams.get("scope") || "all";

  const restBase = `${env.SUPABASE_URL}/rest/v1/user_stats`;
  const params = new URLSearchParams();
  params.set(
    "select",
    "user_id,best_ent_score,total_tests_completed,average_score,profiles!inner(username,school,class_number,class_letter,country,city)"
  );
  params.set("best_ent_score", "not.is.null");
  params.set("order", "best_ent_score.desc");
  params.set("limit", "100");

  const headers = supabaseHeaders(env, null, true);
  const res = await fetch(`${restBase}?${params.toString()}`, { headers });
  if (!res.ok) {
    return jsonResponse({ ratings: fallbackRatings(), total: 0, error: "Supabase error" });
  }
  const data = await res.json();
  let ratings = data.map((stat) => ({
    id: stat.user_id,
    username: stat.profiles?.username || "Unknown",
    school: stat.profiles?.school || "Unknown School",
    class: stat.profiles?.class_number
      ? `${stat.profiles.class_number}${stat.profiles.class_letter || ""}`
      : "Unknown",
    score: stat.best_ent_score || 0,
    bestENT: stat.best_ent_score || 0,
    totalTests: stat.total_tests_completed || 0,
    averageScore: Math.round((stat.average_score || 0) * 100) / 100,
    country: stat.profiles?.country || "kz",
    city: stat.profiles?.city || "unknown"
  }));

  if (subject && subject !== "all") {
    
  }

  if (scope === "school" || scope === "class") {
    const token = getBearerToken(request);
    const user = await getUserFromToken(env, token);
    let school = "Dostyq School";
    let className = "11A";

    if (user?.id) {
      const profileParams = new URLSearchParams();
      profileParams.set("select", "school,class_number,class_letter");
      profileParams.set("user_id", `eq.${user.id}`);
      profileParams.set("limit", "1");
      const profileRes = await fetch(
        `${env.SUPABASE_URL}/rest/v1/profiles?${profileParams.toString()}`,
        { headers: supabaseHeaders(env, token) }
      );
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        const profile = profileData?.[0];
        if (profile?.school) school = profile.school;
        if (profile?.class_number) {
          className = `${profile.class_number}${profile.class_letter || ""}`;
        }
      }
    }

    if (scope === "school") {
      ratings = ratings.filter((item) => item.school === school);
    } else {
      ratings = ratings.filter((item) => item.school === school && item.class === className);
    }
  }

  if (type === "average") {
    ratings.sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0));
  } else if (type === "total") {
    ratings.sort((a, b) => (b.totalTests || 0) - (a.totalTests || 0));
  } else {
    ratings.sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  const responseTime = Date.now() - startTime;
  return jsonResponse({
    ratings,
    total: ratings.length,
    cached: false,
    responseTime
  });
}

function fallbackRatings() {
  return [
    {
      id: "fallback-1",
      username: "Aizhan",
      school: "Dostyq School",
      class: "11A",
      score: 125,
      bestENT: 125,
      totalTests: 15,
      averageScore: 115,
      country: "kz",
      city: "almaty"
    },
    {
      id: "fallback-2",
      username: "Daniyar",
      school: "NIS",
      class: "11B",
      score: 118,
      bestENT: 118,
      totalTests: 12,
      averageScore: 108,
      country: "kz",
      city: "astana"
    },
    {
      id: "fallback-3",
      username: "Madiyar",
      school: "BIL",
      class: "11A",
      score: 115,
      bestENT: 115,
      totalTests: 18,
      averageScore: 112,
      country: "kz",
      city: "almaty"
    }
  ];
}

async function handleApi(request, env) {
  const url = new URL(request.url);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: DEFAULT_HEADERS });
  }

  if (url.pathname === "/health") {
    return jsonResponse({ status: "OK", timestamp: new Date().toISOString() });
  }

  if (url.pathname === "/api/config" && request.method === "GET") {
    return jsonResponse({
      supabaseUrl: env.SUPABASE_URL,
      supabaseAnonKey: env.SUPABASE_ANON_KEY,
      aiTeacherApiUrl: env.AI_TEACHER_API_URL || ""
    }, 200, { "Cache-Control": "no-store" });
  }

  if (url.pathname === "/api/rating" && request.method === "GET") {
    return handleRating(request, env);
  }

  if (url.pathname === "/api/materials") {
    return handleMaterials(request, env);
  }

  if (url.pathname === "/api/favorites") {
    return handleFavorites(request, env);
  }

  if (url.pathname === "/api/profile") {
    return handleProfile(request, env);
  }

  return jsonResponse({ error: "Route not found" }, 404);
}

async function serveAsset(request, env) {
  if (!env.ASSETS?.fetch) {
    return new Response("Assets binding not configured", { status: 500 });
  }

  let response = await env.ASSETS.fetch(request);
  if (response.status === 404) {
    const url = new URL(request.url);
    url.pathname = "/index.html";
    response = await env.ASSETS.fetch(new Request(url.toString(), { method: "GET" }));
  }
  return response;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/") || url.pathname === "/health") {
      return handleApi(request, env);
    }
    return serveAsset(request, env);
  }
};
