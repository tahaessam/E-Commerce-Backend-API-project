/**

* ==========================================================
* NESTJS QUICK REFERENCE
* ==========================================================
*
* Request Lifecycle:
*
* Client
* ↓
* Middleware
* ↓
* Guard
* ↓
* Interceptor
* ↓
* Pipe
* ↓
* Controller
* ↓
* Service
* ↓
* Database
* ↓
* Response
*
* ---
* CONTROLLER
* ---
*
* Controller receives HTTP requests and returns responses.
*
* Example:
*
* @Controller('users')
* export class UsersController {}
*

*/

/**

* ==========================================================
* DEPENDENCY INJECTION (DI)
* ==========================================================
*
* Nest creates service instances automatically and injects
* them into controllers.
*
* Controller depends on Service.
*
* Example:
*
* constructor(
* private readonly userService: UserService,
* ) {}
*

*/

import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { IsPublic } from '../common/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @IsPublic()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}

/**

* ==========================================================
* STANDARD APPROACH (RECOMMENDED)
* ==========================================================
*
* Uses NestJS decorators:
*
* @Body()
* @Param()
* @Query()
*
* Platform agnostic:
* Works with Express and Fastify.
*
* Nest handles Request and Response automatically.
*

*/

/*

@Controller('users')
export class UsersController {

// GET /users?page=1
@Get()
findAll(@Query('page') page: string) {
return {
message: 'Users fetched successfully',
page,
};
}

// GET /users/10
@Get(':id')
findOne(@Param('id') id: string) {
return {
userId: id,
};
}

// POST /users
@Post()
create(@Body() body: any) {
return body;
}
}

*/

/**

* ==========================================================
* LIBRARY-SPECIFIC APPROACH (EXPRESS)
* ==========================================================
*
* Uses Express objects directly:
*
* @Req()
* @Res()
*
* Tied to Express.
*
* If you move to Fastify,
* this code may need changes.
*

*/

/*

import { Request, Response } from 'express';

@Controller('users')
export class UsersController {

@Get()
findAll(
@Req() req: Request,
@Res() res: Response,
) {

```
console.log(req.method);
console.log(req.url);

res.status(200).json({
  message: 'Success',
});
```

}

}

*/

/**

* ==========================================================
* REQUEST
* ==========================================================
*
* Data sent FROM client TO server.
*
* Examples:
*
* GET /users
* POST /auth/login
*
* Request contains:
*
* * body
* * params
* * query
* * headers
*

*/

/**

* ==========================================================
* RESPONSE
* ==========================================================
*
* Data sent FROM server TO client.
*
* Example:
*
* return {
* message: 'success'
* }
*
* Nest converts it automatically to JSON.
*

*/

/**

* ==========================================================
* PARAM
* ==========================================================
*
* URL Parameter
*
* GET /users/10
*
* @Param('id') => 10
*

*/

/*

@Get(':id')
findOne(@Param('id') id: string) {
return id;
}

*/

/**

* ==========================================================
* QUERY
* ==========================================================
*
* GET /users?page=2
*
* @Query('page') => 2
*

*/

/*

@Get()
findAll(@Query('page') page: string) {
return page;
}

*/

/**

* ==========================================================
* BODY
* ==========================================================
*
* POST /users
*
* Body:
*
* {
* "name": "Ahmed"
* }
*

*/

/*

@Post()
create(@Body() body: any) {
return body;
}

*/

/**

* ==========================================================
* MIDDLEWARE & next()
* ==========================================================
*
* Middleware executes BEFORE controller.
*
* next() passes control to the next middleware
* or controller.
*
* Without next(), request stops here.
*

*/

/*

@Injectable()
export class LoggerMiddleware
implements NestMiddleware {

use(req, res, next) {

```
console.log(req.url);

next();
```

}
}

*/

/**

* ==========================================================
* MOST COMMON DECORATORS
* ==========================================================
*
* @Controller()
* @Get()
* @Post()
* @Put()
* @Delete()
* @Patch()
*
* @Body()
* @Param()
* @Query()
* @Req()
* @Res()
*
* @Injectable()
* @Module()
*

*/

/**

* ==========================================================
* GOLDEN RULE
* ==========================================================
*
* 90% of the time:
*
* Use Standard Approach
*
* @Body()
* @Param()
* @Query()
*
* Avoid:
*
* @Req()
* @Res()
*
* unless you need direct Express control.
*

*/
