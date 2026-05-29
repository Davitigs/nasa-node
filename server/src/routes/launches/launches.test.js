const request = require('supertest');
const app = require('../../app');
const { 
  mongoConnect,
  mongoDisconnect
 } = require('../../services/mongo')

describe('Launches API', () => {
  beforeAll(async () => {
    await mongoConnect();
  });

  // afterAll(async () => {
  //   await mongoDisconnect();
  // })


  describe('Test GET /launches', () => {
    test('It should respond with 200 success', async () => {
      const response = await request(app).get('/v1/launches')
      .expect("Content-Type", /json/)
      .expect(200);
    });
  });
  
  describe('Test POST /launch', () => {
    const testBody = {
      mission: "Complete",
      rocket: "My rocket",
      target: "Kepler-62 f",
      launchDate: "Jan 27, 2080"
    };
  
    const testBodyWithoutDate = {
      mission: "Complete",
      rocket: "My rocket",
      target: "Kepler-62 f",
    }
  
    const testBodyWithInvalidDate = {
      mission: "Complete",
      rocket: "My rocket",
      target: "Kepler-62 f",
      launchDate: "brno"
    };
    test('it should respond with 201 created', async () => {
      const response = await request(app)
        .post('/v1/launches')
        .send(testBody)
        .expect("Content-Type", /json/)
        .expect(201);
  
        const requestDate = new Date(testBody.launchDate).valueOf();
        const responseDate = new Date(response.body.launchDate).valueOf();
        expect(responseDate).toBe(requestDate);
        expect(response.body).toMatchObject(testBodyWithoutDate);
    });
    test('it should catch missing required properties ', async () => {
      const response = await request(app)
        .post('/v1/launches')
        .send(testBodyWithoutDate)
        .expect("Content-Type", /json/)
        .expect(400);
  
        expect(response.body).toStrictEqual({
          error: 'Some required properties are missing!'
        })
    });
    test('it should catch Invalid dates', async () => {
      const response = await request(app)
        .post('/v1/launches')
        .send(testBodyWithInvalidDate)
        .expect("Content-Type", /json/)
        .expect(400);
  
        expect(response.body).toStrictEqual({
          error: 'Invalid Launch Date'
        })
    });
  })
})