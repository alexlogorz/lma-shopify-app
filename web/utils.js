// utils.js
import shopify from './shopify.js';
import crypto from 'crypto';

async function getCustomersWithMetafields(session) {
  const client = new shopify.api.clients.Graphql({ session });

  const query = `
    {
      customers(first: 50) {
        edges {
          node {
            id
            firstName
            lastName
            email
            metafields(first: 10, namespace: "custom") {
              edges {
                node {
                  key
                  value
                  namespace
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await client.query({ data: query });

    const customers = response.body.data.customers.edges.map(({ node }) => {
      const onboardedMeta = node.metafields.edges.find(
        ({ node }) => node.namespace === "custom" && node.key === "completed_onboarding"
      );

      const onboarded = onboardedMeta?.node.value === "true";

      return {
        id: node.id,
        name: `${node.firstName || ''} ${node.lastName || ''}`.trim(),
        email: node.email,
        onboarded,
      };
    });

    return customers;
  } catch (error) {
    console.error("GraphQL error:", error);
    throw new Error("Failed to fetch customers");
  }
}

async function getStudentById(session, customerId) {
    const client = new shopify.api.clients.Graphql({ session });
  
    const query = `
      query getCustomer($id: ID!) {
        customer(id: $id) {
          id
          firstName
          lastName
          email
          metafields(first: 10, namespace: "custom") {
            edges {
              node {
                key
                value
                namespace
              }
            }
          }
        }
      }
    `;
  
    const variables = {
      id: `gid://shopify/Customer/${customerId}`,
    };
  
    try {
      const response = await client.query({ data: { query, variables } });
      const customer = response.body.data.customer;
  
      if (!customer) return null;
  
      const onboardedMeta = customer.metafields.edges.find(
        ({ node }) => node.namespace === "custom" && node.key === "completed_onboarding"
      );
  
      return {
        id: customer.id,
        name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
        email: customer.email,
        onboarded: onboardedMeta?.node.value === "true",
      };
    } 
    catch (error) {
      console.error("GraphQL error:", error);
      throw error;
    }
}

async function getCourses(session) {
    const client = new shopify.api.clients.Graphql({ session });

    const query = `
      {
        metaobjects(type: "course", first: 50) {
          edges {
            node {
              id
              handle
              fields {
                key
                value
              }
            }
          }
        }
      }
    `;

    try {
      const response = await client.query({ data: query });

      const courses = response.body.data.metaobjects.edges.map(({ node }) => {
        const course = {
          id: node.id,
          handle: node.handle,
        };

        node.fields.forEach((field) => {
          course[field.key] = field.value;
        });

        return course;
      });

      return courses;
    } 
    catch (error) {
      console.error("GraphQL error in getCourses:", error);
      throw error;
    }
}
  
async function getCourseByHandle(session, handle) {
    const client = new shopify.api.clients.Graphql({ session });

    const query = `
      query GetCourseByHandle($handle: String!) {
        metaobjectByHandle(handle: { type: "course", handle: $handle }) {
          id
          handle
          type
          fields {
            key
            value
            references(first: 50) {
              edges {
                node {
                  ... on Metaobject {
                    id
                    handle
                    type
                    fields {
                      key
                      value
                      references(first: 50) {
                        edges {
                          node {
                            ... on Metaobject {
                              id
                              handle
                              type
                              fields {
                                key
                                value
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const variables = { handle };

    try {
      const response = await client.query({ data: { query, variables } });
      const metaobject = response.body.data.metaobjectByHandle;

      if (!metaobject) return null;

      const course = {
        id: metaobject.id,
        handle: metaobject.handle,
        modules: [],
      };

      for (const field of metaobject.fields) {
        if (field.key === 'modules' && field.references) {
          for (const edge of field.references.edges) {
            const moduleNode = edge.node;
            const module = {
              id: moduleNode.id,
              handle: moduleNode.handle,
              title: '',
              description: '',
              lessons: [],
            };

            for (const f of moduleNode.fields) {
              if (f.key === 'title') 
                module.title = f.value;
              else if (f.key === 'description') 
                module.description = f.value;
              else if (f.key === 'lessons' && f.references) {
                for (const lessonEdge of f.references.edges) {
                  const lessonNode = lessonEdge.node;
                  const lesson = {};

                  lessonNode.fields.forEach(lf => {
                    lesson[lf.key] = lf.value;
                  });

                  module.lessons.push(lesson);
                }
              }
            }

            course.modules.push(module);
          }
        } 
        else {
          course[field.key] = field.value;
        }
      }

      return course;
    } 
    catch (error) {
      console.error("Error fetching expanded course:", error);
      throw error;
    }
}

async function getRegisteredCourses(session, customerId) {
  const client = new shopify.api.clients.Graphql({ session });

  const query = `
    query GetRegisteredCourses($id: ID!) {
      customer(id: $id) {
        metafield(namespace: "custom", key: "registered_courses") {
          references(first: 50) {
            edges {
              node {
                ... on Metaobject {
                  handle
                }
              }
            }
          }
        }
      }
    }
  `;

  const variables = {
    id: `gid://shopify/Customer/${customerId}`
  }

  const response = await client.query({ data: { query, variables } });
  const handles = response?.body?.data?.customer?.metafield?.references?.edges.map((edge) => edge.node.handle) || []

  return handles
}

async function getCompletedLessons(session, customerId) {
  const client = new shopify.api.clients.Graphql({ session });

  const query = `
    query GetCompletedLessons($id: ID!) {
      customer(id: $id) {
        metafield(namespace: "custom", key: "completed_lessons") {
          references(first: 100) {
            edges {
              node {
                ... on Metaobject {
                  id
                }
              }
            }
          }
        }
      }
    }
  `;

  const variables = {
    id: `gid://shopify/Customer/${customerId}`
  }

  const response = await client.query({ data: { query, variables } });
  const lessons = response?.body?.data?.customer?.metafield?.references?.edges.map((edge) => edge.node.id) || []

  return lessons;
}

function insertOnboardingSubmission(db, formData) {
  const {
    customerId,
    firstName,
    lastName,
    email,
    phone,
    studentLoc,
    prefStartDate,
    prefInstructor,
    lessonPackage,
    goals,
    expLevel,
    musicPreferences,
    hoursAvail,
    equipmentAccess,
    otherNotes
  } = formData;

  const query = `
    INSERT INTO onboarding_submissions (
      customer_id,
      first_name,
      last_name,
      email,
      phone,
      location,
      preferred_start_date,
      preferred_instructor,
      lesson_package,
      goals,
      experience_level,
      music_preferences,
      weekly_hours_available,
      equipment_access,
      additional_notes,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    customerId,
    firstName,
    lastName,
    email,
    phone,
    studentLoc,
    prefStartDate,
    prefInstructor,
    lessonPackage,
    goals,
    expLevel,
    Array.isArray(musicPreferences)
      ? musicPreferences.join(', ')
      : musicPreferences,
    hoursAvail,
    equipmentAccess,
    otherNotes || '',
    new Date().toISOString().split('T')[0]
  ];

  return new Promise((resolve, reject) => {
    db.run(query, params, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

async function updateOnboardedMetafield(session, customerId, value = true) {
  const client = new shopify.api.clients.Graphql({ session });

  const mutation = `
    mutation UpdateCustomerMetafield($input: CustomerInput!) {
      customerUpdate(input: $input) {
        customer {
          id
          metafield(namespace: "custom", key: "completed_onboarding") {
            value
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      id: `gid://shopify/Customer/${customerId}`,
      metafields: [
        {
          namespace: "custom",
          key: "completed_onboarding",
          type: "boolean",
          value: value ? "true" : "false",
        },
      ],
    },
  };

  const response = await client.query({ data: { query: mutation, variables } });

  const errors = response.body.data.customerUpdate.userErrors;
  if (errors.length > 0) {
    console.error("Metafield update errors:", errors);
    throw new Error("Failed to update onboarded metafield");
  }

  return response.body.data.customerUpdate.customer;
}

// Middleware to verify shopify requests
function verifyProxyRequest(req, res, next) {
  const query = { ...req.query }
  const signature = query.signature

  if (!signature) {
    return res.status(403).json({
      error: "Missing signature"
    })
  }

  delete query.signature

  const sortedParams = Object.keys(query).sort().map(key => `${key}=${query[key]}`).join('');
  const calculatedSignature = crypto.createHmac('sha256', process.env.SHOPIFY_API_SECRET).update(sortedParams).digest('hex');

  // Compare signatures securely
  if (!crypto.timingSafeEqual(Buffer.from(calculatedSignature, "utf8"), Buffer.from(signature, "utf8"))) {
    return res.status(403).send("Invalid signature");
  }

  // Proceed
  next()
}

export { 
  getCustomersWithMetafields, 
  getStudentById, 
  getCourses, 
  getCourseByHandle, 
  getRegisteredCourses, 
  getCompletedLessons,
  insertOnboardingSubmission,
  verifyProxyRequest,
  updateOnboardedMetafield
};
  