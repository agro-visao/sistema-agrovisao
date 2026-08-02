function i(e,t=200){return new Response(JSON.stringify(e),{status:t,headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET, OPTIONS","Access-Control-Allow-Headers":"Content-Type"}})}function n(e,t=500){return i({data:null,error:e},t)}import{createClient as m}from"@supabase/supabase-js";var s=class extends Error{constructor(t,a=401){super(t),this.status=a}},c=null,l="";function u(e){let t=["SUPABASE_URL","SUPABASE_SERVICE_ROLE_KEY"].filter(o=>!e||!e[o]);if(t.length)throw new s(`Servi\xE7o indispon\xEDvel: vari\xE1vel ausente \u2014 ${t.join(", ")}.`,503);let a=`${e.SUPABASE_URL}::${e.SUPABASE_SERVICE_ROLE_KEY}`;return c&&l===a||(c=m(e.SUPABASE_URL,e.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:!1,autoRefreshToken:!1}}),l=a),c}var A=5*1024*1024;var h="product-images";function d(e,t){if(!t)return"";let a=u(e),{data:o}=a.storage.from(h).getPublicUrl(t);return o&&o.publicUrl||""}async function y(e){let{request:t,env:a}=e;if(t.method==="OPTIONS")return i(null,204);if(t.method!=="GET")return n("Method not allowed",405);try{let o=u(a),{data:f,error:p}=await o.from("project_images").select(`
        *,
        projects!inner (
          id,
          slug,
          name,
          category,
          category_label,
          active,
          sort_order
        )
      `).eq("projects.active",!0).order("sort_order",{ascending:!0});if(p)return n(p.message,500);let g=(f||[]).map(r=>({id:r.id,url:/^https?:\/\//.test(r.url)?r.url:d(a,r.url),alt:r.alt,description:r.description||"",featured:!!r.featured,parentId:r.parent_id||null,sortOrder:r.sort_order,createdAt:r.created_at,project:{id:r.projects.id,slug:r.projects.slug,name:r.projects.name,category:r.projects.category,categoryLabel:r.projects.category_label}}));return i({data:g})}catch(o){return o instanceof s?n(o.message,o.status):n(o.message)}}export{y as onRequest};
