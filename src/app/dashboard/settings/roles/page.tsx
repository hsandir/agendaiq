              <div className="text-2xl font-bold">
                {roles.filter((r: any) => r.is_leadership).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Staff Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {roles.filter((r: any) => !r.is_leadership).length}
              </div>
            </CardContent>
          </Card>